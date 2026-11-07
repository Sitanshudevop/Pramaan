"""Comprehensive tests for workspace settings persistence and behavioral enforcement."""

from datetime import UTC, datetime, timedelta

import pytest
from app.auth.dependencies import WorkspaceContext
from app.constants import Role
from app.models.base import engine
from app.models.entities import (
    AuditLogModel,
    ContentTypeModel,
    RefreshTokenModel,
    ReviewModel,
    UserModel,
    WorkspaceModel,
)
from app.schemas.schemas import (
    CreateContentTypeRequest,
    CreateReviewRequest,
    PurposeCard,
    WorkspaceSettingsUpdateRequest,
)
from app.services.review_service import ReviewService
from app.services.workflow_service import WorkflowService
from fastapi import HTTPException
from sqlalchemy.orm import Session, sessionmaker

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create clean database session for each test run."""
    db = TestSessionLocal()
    try:
        from app.seed.demo_story import seed_demo_story

        seed_demo_story(db)
        yield db
    finally:
        db.close()


def test_sla_changes_overdue_calculation(db_session: Session):
    """B4.1: Changing SLA dynamically alters which reviews calculate as 'overdue'."""
    ws = db_session.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()
    assert ws is not None

    # Get active reviews in human review or ai-reviewed
    active_reviews = (
        db_session.query(ReviewModel)
        .filter(
            ReviewModel.workspace_id == "ws-demo",
            ReviewModel.status.in_(["Submitted", "In human review", "AI-reviewed"]),
        )
        .all()
    )
    assert len(active_reviews) > 0

    # With default 48h SLA, some reviews are overdue
    ws.sla_hours = 48
    db_session.commit()
    overdue_count_48 = sum(1 for r in active_reviews if r.is_overdue)

    # When SLA is increased to 5000 hours (over 200 days), none should be overdue
    ws.sla_hours = 5000
    db_session.commit()
    overdue_count_5000 = sum(1 for r in active_reviews if r.is_overdue)
    assert overdue_count_5000 == 0

    # When SLA is reduced to 1 hour, older reviews must be overdue
    ws.sla_hours = 1
    db_session.commit()
    overdue_count_1 = sum(1 for r in active_reviews if r.is_overdue)
    assert overdue_count_1 >= overdue_count_48


def test_content_type_manager_signoff_blocks_reviewer(db_session: Session):
    """B4.2: Content type requiring manager approval blocks Reviewer and allows Brand Manager."""
    ws = db_session.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()
    assert ws is not None

    # Find or set content type to require manager approval
    ct = (
        db_session.query(ContentTypeModel)
        .filter(
            ContentTypeModel.workspace_id == "ws-demo",
            ContentTypeModel.name == "Landing page",
        )
        .first()
    )
    assert ct is not None
    ct.requires_manager_approval = True
    db_session.commit()

    # Find a review with this content type
    review = (
        db_session.query(ReviewModel)
        .filter(
            ReviewModel.workspace_id == "ws-demo",
            ReviewModel.content_type == "Landing page",
        )
        .first()
    )
    assert review is not None

    workflow = WorkflowService(db_session, workspace_id="ws-demo")

    # A Reviewer trying to approve must be blocked with PermissionError
    with pytest.raises(PermissionError) as exc_info:
        workflow.record_approval_decision(
            review_id=review.id,
            actor_role=Role.REVIEWER,
            outcome="Approved",
            reason="Looks good to me",
        )
    assert "requires manager sign-off" in str(exc_info.value).lower()

    # A Brand Manager trying to approve must succeed
    approved_rev = workflow.record_approval_decision(
        review_id=review.id,
        actor_role=Role.BRAND_MANAGER,
        outcome="Approved",
        reason="Brand manager executive sign-off confirmed",
    )
    assert approved_rev.status == "Approved"


def test_auto_assign_on_submission(db_session: Session):
    """B4.3: Auto-assign assigns designated reviewer when review is submitted."""
    ws = db_session.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()
    assert ws is not None
    ws.auto_assign_mode = "by_brand_kit"

    # Configure content type with default reviewer
    ct = (
        db_session.query(ContentTypeModel)
        .filter(ContentTypeModel.workspace_id == "ws-demo", ContentTypeModel.name == "Social post")
        .first()
    )
    assert ct is not None
    ct.default_reviewer_id = "usr-rohan"
    db_session.commit()

    req = CreateReviewRequest(
        brand_kit_id="kettle-and-co",
        content="Enjoy our natural artisanal tea hand-picked for quality and balance.",
        content_type="Social post",
        purpose_card=PurposeCard(
            goal="Promote evening tea",
            audience="Tea lovers",
            key_message="Natural tea",
            call_to_action="Shop today",
            content_type="Social post",
            ai_declared=False,
            locked_phrases=[],
        ),
        ai_declared=False,
        assignee_id=None,  # Leave unassigned so auto-assign triggers
    )

    import asyncio

    review_service = ReviewService(db_session, workspace_id="ws-demo")
    created_review = asyncio.run(review_service.execute_review(req, actor_role=Role.CREATOR))

    assert created_review.assignee_id == "usr-rohan"


def test_content_types_crud_and_listing(db_session: Session):
    """B4.4: Adding and archiving content types alters available listing."""
    from app.api.workspaces import archive_content_type, create_content_type, list_content_types

    ctx_admin = WorkspaceContext(
        workspace=db_session.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first(),
        membership=None,
        is_demo=True,
        effective_role="Admin",
    )

    # 1. Add new content type
    create_req = CreateContentTypeRequest(
        name="Quarterly Shareholder Letter",
        description="Formal financial reports to investors",
        requires_manager_approval=True,
        default_reviewer_id="usr-anika",
    )
    created_ct = create_content_type("ws-demo", create_req, None, ctx_admin, db_session)
    assert created_ct.name == "Quarterly Shareholder Letter"
    assert created_ct.requires_manager_approval is True

    # 2. Check listing includes new type
    types_list = list_content_types("ws-demo", False, ctx_admin, db_session)
    names = [t.name for t in types_list]
    assert "Quarterly Shareholder Letter" in names

    # 3. Archive content type
    archive_content_type("ws-demo", created_ct.id, None, ctx_admin, db_session)

    # 4. Check active listing no longer includes archived type
    active_types = list_content_types("ws-demo", False, ctx_admin, db_session)
    active_names = [t.name for t in active_types]
    assert "Quarterly Shareholder Letter" not in active_names


def test_role_gating_creator_cannot_modify_settings(db_session: Session):
    """B4.9: Creator receives 403 when attempting to change governance settings."""
    from app.api.workspaces import update_workspace_settings_detailed

    ctx_creator = WorkspaceContext(
        workspace=db_session.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first(),
        membership=None,
        is_demo=True,
        effective_role="Creator",
    )

    update_req = WorkspaceSettingsUpdateRequest(
        name="Hacked Workspace Name",
        retention_days=30,
    )

    with pytest.raises(HTTPException) as exc_info:
        update_workspace_settings_detailed("ws-demo", update_req, None, ctx_creator, db_session)

    assert exc_info.value.status_code == 403
    assert "Creators cannot modify workspace settings" in exc_info.value.detail


def test_retention_policy_and_sessions(db_session: Session):
    """B4.8: Retention cleanup and session revocation endpoints record audit events."""
    from app.api.auth import list_active_sessions, revoke_session
    from app.api.workspaces import run_retention_policy

    ctx_admin = WorkspaceContext(
        workspace=db_session.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first(),
        membership=None,
        is_demo=True,
        effective_role="Admin",
    )

    # Retention run
    ret_res = run_retention_policy("ws-demo", None, ctx_admin, db_session)
    assert ret_res.retention_days == 90

    # Verify audit log recorded RETENTION_POLICY_EXECUTED
    ret_audit = (
        db_session.query(AuditLogModel)
        .filter(
            AuditLogModel.workspace_id == "ws-demo",
            AuditLogModel.action == "RETENTION_POLICY_EXECUTED",
        )
        .first()
    )
    assert ret_audit is not None

    # Test sessions
    user = db_session.query(UserModel).filter(UserModel.id == "usr-meera").first()
    assert user is not None

    import uuid

    # Add a mock session with unique hash
    sess_id = f"ref-test-{uuid.uuid4().hex[:8]}"
    token = RefreshTokenModel(
        id=sess_id,
        user_id=user.id,
        token_hash=f"hash-{uuid.uuid4().hex}",
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    db_session.add(token)
    db_session.commit()

    active_sess = list_active_sessions(None, user, db_session)
    assert any(s.id == sess_id for s in active_sess)

    # Revoke session
    rev_res = revoke_session(sess_id, user, db_session)
    assert rev_res["status"] == "revoked"

    db_session.refresh(token)
    assert token.revoked_at is not None
