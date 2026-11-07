"""Test suite verifying the deterministic 8-week demo story generator and data connections.

Validates:
1. Referential integrity: no orphan rows, all cited foreign keys exist.
2. Cross-page consistency: counts across Queue, Hub, Audit, Insights match DB aggregates.
3. Audit verification passes with real record count and non-GENESIS head hash.
4. Determinism: two generations with the same seed produce identical content.
5. No empty states for any of the 6 personas.
6. Multi-tenant isolation: demo workspace data never leaks into real workspaces.
"""

from datetime import UTC, datetime

import pytest
from app.api.audit import verify_audit_integrity
from app.auth.dependencies import WorkspaceContext
from app.constants import Role
from app.models.base import Base, engine
from app.models.entities import (
    ApprovalModel,
    AuditLogModel,
    BrandKitModel,
    CommentModel,
    DecisionModel,
    FactModel,
    FindingModel,
    NotificationModel,
    ReviewModel,
    RuleModel,
    WorkspaceModel,
)
from app.repositories.insights_repo import InsightsRepository
from app.seed.demo_story import CAST_USERS, seed_demo_story, wipe_demo_workspace
from sqlalchemy.orm import sessionmaker

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_demo_story():
    """Ensure database schema is created and demo story is freshly seeded."""
    Base.metadata.create_all(bind=engine)
    db = TestSessionLocal()
    seed_demo_story(db)
    db.close()


def test_referential_integrity():
    """Verify that every finding, decision, comment, approval, notification links to valid parents."""
    db = TestSessionLocal()
    try:
        # 1. Reviews link to ws-demo and valid brand kits
        reviews = db.query(ReviewModel).filter(ReviewModel.workspace_id == "ws-demo").all()
        assert len(reviews) == 36, f"Expected 36 reviews, got {len(reviews)}"
        kit_ids = {
            k.id
            for k in db.query(BrandKitModel).filter(BrandKitModel.workspace_id == "ws-demo").all()
        }
        assert "kettle-and-co" in kit_ids
        assert "ledgerleaf" in kit_ids

        rev_id_set = {r.id for r in reviews}
        for r in reviews:
            assert r.kit_id in kit_ids, f"Review {r.id} references non-existent kit {r.kit_id}"
            assert r.creator_id in [u["id"] for u in CAST_USERS], f"Unknown creator {r.creator_id}"

        # 2. Findings link to reviews
        findings = (
            db.query(FindingModel)
            .join(ReviewModel)
            .filter(ReviewModel.workspace_id == "ws-demo")
            .all()
        )
        assert len(findings) > 100
        for f in findings:
            assert f.review_id in rev_id_set, f"Orphan finding {f.id} with review {f.review_id}"

        # 3. Decisions link to existing findings
        decisions = db.query(DecisionModel).all()
        assert len(decisions) >= 50
        finding_id_set = {f.id for f in findings}
        for d in decisions:
            assert d.finding_id in finding_id_set, (
                f"Orphan decision {d.id} on finding {d.finding_id}"
            )

        # 4. Comments link to existing reviews
        comments = db.query(CommentModel).all()
        assert len(comments) >= 35
        for c in comments:
            assert c.review_id in rev_id_set, f"Orphan comment {c.id} on review {c.review_id}"

        # 5. Approvals link to existing reviews
        approvals = db.query(ApprovalModel).all()
        assert len(approvals) >= 20
        for a in approvals:
            assert a.review_id in rev_id_set, f"Orphan approval {a.id} on review {a.review_id}"

        # 6. Notifications link to valid users
        notifs = (
            db.query(NotificationModel).filter(NotificationModel.workspace_id == "ws-demo").all()
        )
        user_ids = {u["id"] for u in CAST_USERS}
        for n in notifs:
            assert n.user_id in user_ids, f"Notification {n.id} targets invalid user {n.user_id}"

    finally:
        db.close()


def test_cross_page_consistency():
    """Verify totals agree across Hub, Queue, Audit, and Insights aggregates."""
    db = TestSessionLocal()
    try:
        # Hub counts
        rules_kc = db.query(RuleModel).filter(RuleModel.kit_id == "kettle-and-co").count()
        rules_ll = db.query(RuleModel).filter(RuleModel.kit_id == "ledgerleaf").count()
        assert rules_kc == 15  # 14 active + 1 proposed v2
        assert rules_ll == 12

        facts_kc = db.query(FactModel).filter(FactModel.kit_id == "kettle-and-co").count()
        facts_ll = db.query(FactModel).filter(FactModel.kit_id == "ledgerleaf").count()
        assert facts_kc == 7
        assert facts_ll == 6

        # Queue Status counts
        reviews = db.query(ReviewModel).filter(ReviewModel.workspace_id == "ws-demo").all()
        status_map: dict[str, int] = {}
        for r in reviews:
            s_key = str(r.status)
            status_map[s_key] = status_map.get(s_key, 0) + 1

        assert status_map.get("Draft") == 3
        assert status_map.get("AI-reviewed") == 4
        assert status_map.get("In human review") == 6
        assert status_map.get("Changes requested") == 4
        assert status_map.get("Approved") == 14
        assert status_map.get("Rejected") == 2
        assert status_map.get("Exported") == 3

        # Overdue count
        overdue_reviews = [r for r in reviews if r.is_overdue]
        assert len(overdue_reviews) == 5, (
            f"Expected exactly 5 overdue reviews, got {len(overdue_reviews)}"
        )

        # Insights verification
        insights_repo = InsightsRepository(db, workspace_id="ws-demo")
        insights = insights_repo.get_insights()
        assert insights.total_events > 150
        assert len(insights.top_repeated_violations) >= 3

        # Audit count
        audits_count = (
            db.query(AuditLogModel).filter(AuditLogModel.workspace_id == "ws-demo").count()
        )
        assert audits_count >= 100

    finally:
        db.close()


def test_audit_cryptographic_verification():
    """Verify that audit log integrity verification passes with non-GENESIS hash and >100 entries."""
    db = TestSessionLocal()
    try:
        ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()
        ctx = WorkspaceContext(workspace=ws, membership=None, is_demo=True, effective_role="Admin")
        result = verify_audit_integrity(role=Role.ADMIN, ctx=ctx, db=db)

        assert result["status"] == "verified"
        assert result["total_records"] >= 100
        assert result["latest_hash"] != "GENESIS"
        assert len(result["latest_hash"]) == 64  # SHA-256 hex string
        assert result["tamper_evident"] is True
    finally:
        db.close()


def test_generator_determinism():
    """Verify running the generator with fixed seed produces identical content."""
    db = TestSessionLocal()
    try:
        fixed_time = datetime(2026, 11, 7, 12, 0, tzinfo=UTC)

        wipe_demo_workspace(db)
        counts_run1 = seed_demo_story(db, now=fixed_time)

        # Audit hash from run 1
        ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()
        ctx = WorkspaceContext(workspace=ws, membership=None, is_demo=True, effective_role="Admin")
        res1 = verify_audit_integrity(role=Role.ADMIN, ctx=ctx, db=db)

        wipe_demo_workspace(db)
        counts_run2 = seed_demo_story(db, now=fixed_time)
        res2 = verify_audit_integrity(role=Role.ADMIN, ctx=ctx, db=db)

        assert counts_run1 == counts_run2
        assert res1["total_records"] == res2["total_records"]
        assert res1["latest_hash"] == res2["latest_hash"]
    finally:
        db.close()


def test_no_empty_states_for_personas():
    """Verify all 6 personas have notifications and relevant records."""
    db = TestSessionLocal()
    try:
        for u in CAST_USERS:
            notifs = (
                db.query(NotificationModel)
                .filter(
                    NotificationModel.workspace_id == "ws-demo",
                    NotificationModel.user_id == u["id"],
                )
                .all()
            )
            assert 2 <= len(notifs) <= 6, f"User {u['id']} has {len(notifs)} notifs (expected 2-6)"
            unread = [n for n in notifs if not n.is_read]
            assert 1 <= len(unread) <= 4, f"User {u['id']} has {len(unread)} unread (expected 1-4)"
    finally:
        db.close()


def test_demo_isolation():
    """Verify demo data never leaks into real workspaces."""
    db = TestSessionLocal()
    try:
        # Create a real workspace
        real_ws = WorkspaceModel(
            id="ws-real-test",
            name="Real Company",
            slug="real-company",
            industry="Healthcare",
            is_demo=False,
            ai_enabled=True,
        )
        db.add(real_ws)
        db.commit()

        # Query reviews under real_ws
        real_reviews = (
            db.query(ReviewModel).filter(ReviewModel.workspace_id == "ws-real-test").all()
        )
        assert len(real_reviews) == 0

        # Query audit logs under real_ws
        real_audits = (
            db.query(AuditLogModel).filter(AuditLogModel.workspace_id == "ws-real-test").all()
        )
        assert len(real_audits) == 0

        # Clean up
        db.delete(real_ws)
        db.commit()
    finally:
        db.close()
