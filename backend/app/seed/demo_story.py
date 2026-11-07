"""Deterministic 8-week Demo Story generator for Pramaan.

Populates the Demo Workspace ('ws-demo') through authentic code paths:
- 6 Cast members (@example.com) with distinct roles and avatars
- Brand Kits, Rules (with versions & pending proposal), Facts (with superseded & expiring), Glossary, Claim Patterns
- ~36 authentic Reviews across 56 days matching exact status mix
- Real check engine execution generating real FindingModel instances
- Real human decisions (accept, edit, dismiss, override with reason)
- Authentic comments with @mentions
- AI Disclosures (Gemini, Confidential Mode, deterministic)
- Audit log hash-chained with >100 entries
- Targeted notifications per cast member
"""

import json
import random
from datetime import UTC, datetime, timedelta

from app.auth.security import hash_password
from app.checks.context import CheckContext
from app.checks.runner import run_deterministic_checks
from app.constants import DecisionAction, ReviewStatus, Role
from app.models.entities import (
    ApprovalModel,
    AuditLogModel,
    BrandKitModel,
    ClaimPatternModel,
    CommentModel,
    ContentTypeModel,
    DecisionModel,
    DisclosureLedgerModel,
    FactModel,
    FindingModel,
    GlossaryTermModel,
    MembershipModel,
    NotificationModel,
    ReviewModel,
    ReviewVersionModel,
    RuleModel,
    SimulatedEventModel,
    UserModel,
    WorkspaceModel,
)
from app.schemas.schemas import PurposeCard
from sqlalchemy.orm import Session

# Fixed random seed for complete determinism
RNG = random.Random(42)

# Cast Members
CAST_USERS = [
    {
        "id": "usr-meera",
        "email": "meera@example.com",
        "full_name": "Meera Kapoor",
        "role": Role.ADMIN,
        "avatar_color": "#E06D3B",
        "bio": "Admin · Workspace owner",
    },
    {
        "id": "usr-anika",
        "email": "anika@example.com",
        "full_name": "Anika Rao",
        "role": Role.BRAND_MANAGER,
        "avatar_color": "#3B82F6",
        "bio": "Brand manager · Approvals & Rules",
    },
    {
        "id": "usr-rohan",
        "email": "rohan@example.com",
        "full_name": "Rohan Mehta",
        "role": Role.REVIEWER,
        "avatar_color": "#10B981",
        "bio": "Reviewer · Kettle & Co.",
    },
    {
        "id": "usr-dev",
        "email": "dev@example.com",
        "full_name": "Dev Malhotra",
        "role": Role.REVIEWER,
        "avatar_color": "#8B5CF6",
        "bio": "Reviewer · LedgerLeaf compliance",
    },
    {
        "id": "usr-priya",
        "email": "priya@example.com",
        "full_name": "Priya Nair",
        "role": Role.CREATOR,
        "avatar_color": "#EC4899",
        "bio": "Creator · Kettle & Co. social & email",
    },
    {
        "id": "usr-imran",
        "email": "imran@example.com",
        "full_name": "Imran Sheikh",
        "role": Role.CREATOR,
        "avatar_color": "#F59E0B",
        "bio": "Creator · LedgerLeaf copy",
    },
]

CONTENT_TYPES = [
    {
        "id": "ct-promo-email",
        "name": "Promotional email",
        "description": "Customer lifecycle campaigns and product announcements",
        "is_default": True,
        "requires_manager_approval": False,
        "order_index": 1,
    },
    {
        "id": "ct-social-post",
        "name": "Social post",
        "description": "Short-form announcements for LinkedIn, Twitter and Instagram",
        "is_default": False,
        "requires_manager_approval": False,
        "order_index": 2,
    },
    {
        "id": "ct-landing-page",
        "name": "Landing page",
        "description": "Conversion pages, feature launches and pricing tables",
        "is_default": False,
        "requires_manager_approval": True,
        "order_index": 3,
    },
    {
        "id": "ct-press-note",
        "name": "Press note",
        "description": "Public corporate press statements and media kits",
        "is_default": False,
        "requires_manager_approval": True,
        "order_index": 4,
    },
    {
        "id": "ct-app-notif",
        "name": "App notification",
        "description": "In-app alerts, transactional updates and push messages",
        "is_default": False,
        "requires_manager_approval": False,
        "order_index": 5,
    },
]


def _make_timeline_timestamp(
    now: datetime, days_ago: int, hour: int = 11, minute: int = 30
) -> datetime:
    """Generate a realistic weekday timestamp during working hours in Asia/Kolkata."""
    base_date = now - timedelta(days=days_ago)
    # If weekend, shift to previous weekday
    while base_date.weekday() in (5, 6):
        base_date -= timedelta(days=1)
    return datetime(
        base_date.year,
        base_date.month,
        base_date.day,
        hour,
        minute,
        tzinfo=UTC,
    )


def seed_demo_story(db: Session, now: datetime | None = None) -> dict[str, int]:
    """Execute complete deterministic seeding of the 8-week demo story."""
    if now is None:
        now = datetime.now(UTC)

    # 1. Clean out legacy simulated events and existing demo workspace rows
    db.query(SimulatedEventModel).delete()
    wipe_demo_workspace(db)

    # 2. Workspace: Demo Workspace
    demo_ws = WorkspaceModel(
        id="ws-demo",
        name="Demo Workspace",
        slug="demo-workspace",
        industry="Fictional Brands Demo",
        is_demo=True,
        retention_days=90,
        ai_enabled=True,
        timezone="Asia/Kolkata",
        date_format="YYYY-MM-DD",
        default_brand_kit_id="kettle-and-co",
        default_spelling="en-IN",
        manager_approval_severity="Blocker",
        require_decision_reason=True,
        auto_assign_mode="by_brand_kit",
        sla_hours=48,
        confidential_mode=False,
        redaction_options_json=json.dumps({"emails": True, "phones": True, "cards": True}),
        ai_consent_by_id="usr-meera",
        ai_consent_version="v1.2-enterprise",
        created_at=_make_timeline_timestamp(now, 56, 9, 0),
    )
    db.add(demo_ws)
    db.commit()

    # 3. Cast Members
    default_pw_hash = hash_password("demo123456")
    for u_info in CAST_USERS:
        user = db.query(UserModel).filter(UserModel.id == u_info["id"]).first()
        if not user:
            user = UserModel(
                id=u_info["id"],
                email=u_info["email"],
                password_hash=default_pw_hash,
                full_name=u_info["full_name"],
                avatar_color=u_info["avatar_color"],
                notification_language="en-IN",
                notification_preferences_json=json.dumps(
                    {
                        "assigned": True,
                        "mentions": True,
                        "changes_requested": True,
                        "approved": True,
                        "overdue": True,
                    }
                ),
                created_at=_make_timeline_timestamp(now, 56, 9, 15),
            )
            db.add(user)
        else:
            user.full_name = u_info["full_name"]
            user.avatar_color = u_info["avatar_color"]

        # Add or update membership in ws-demo
        membership = (
            db.query(MembershipModel)
            .filter(
                MembershipModel.workspace_id == "ws-demo", MembershipModel.user_id == u_info["id"]
            )
            .first()
        )
        if not membership:
            membership = MembershipModel(
                id=f"mem-{u_info['id'][4:]}-demo",
                workspace_id="ws-demo",
                user_id=u_info["id"],
                role=u_info["role"].value,
                created_at=_make_timeline_timestamp(now, 56, 9, 30),
            )
            db.add(membership)
        else:
            membership.role = u_info["role"].value

    db.commit()

    # 4. Content Types
    for ct in CONTENT_TYPES:
        c_model = ContentTypeModel(
            id=ct["id"],
            workspace_id="ws-demo",
            name=ct["name"],
            description=ct["description"],
            is_default=ct["is_default"],
            requires_manager_approval=ct["requires_manager_approval"],
            default_reviewer_id="usr-rohan"
            if "email" in str(ct["id"]) or "social" in str(ct["id"])
            else "usr-dev",
            order_index=ct["order_index"],
            is_archived=False,
            created_at=_make_timeline_timestamp(now, 56, 10, 0),
        )
        db.add(c_model)
    db.commit()

    # 5. Brand Kits, Rules, Facts, Glossary, Claim Patterns from brand_kits.json
    from pathlib import Path

    brand_kits_path = Path(__file__).parent / "brand_kits.json"
    with open(brand_kits_path, encoding="utf-8") as f:
        kits_data = json.load(f)

    for kit_item in kits_data:
        kit_model = BrandKitModel(
            id=kit_item["id"],
            workspace_id="ws-demo",
            name=kit_item["name"],
            tagline=kit_item["tagline"],
            industry=kit_item["industry"],
            description=kit_item["description"],
            voice_tone=kit_item["voice_tone"],
            primary_language="en-IN",
            target_reading_level=kit_item.get("target_reading_level", 8),
            primary_color=kit_item.get("primary_color", "#1F7A5C"),
            brand_colors_json=json.dumps([kit_item.get("primary_color", "#1F7A5C")]),
            created_at=_make_timeline_timestamp(now, 55, 10, 0),
        )
        db.add(kit_model)

        # Rules
        for r in kit_item.get("rules", []):
            rule_model = RuleModel(
                id=r["id"],
                workspace_id="ws-demo",
                kit_id=kit_item["id"],
                category=r["category"],
                title=r["title"],
                text=r["text"],
                banned_terms_json=json.dumps(r.get("banned_terms", [])),
                preferred_replacement=r.get("preferred_replacement"),
                severity=r["severity"],
                version=r.get("version", "1.0"),
                status=r.get("status", "active"),
                effective_from=r.get("effective_from", "2026-01-01"),
                owner=r.get("owner", "Governance Lead"),
                source=r.get("source", "Brand Guidelines 2026"),
                created_at=_make_timeline_timestamp(now, 55, 10, 30),
            )
            db.add(rule_model)

        # Facts
        for fact in kit_item.get("facts", []):
            fact_model = FactModel(
                id=fact["id"],
                workspace_id="ws-demo",
                kit_id=kit_item["id"],
                subject=fact["subject"],
                aliases_json=json.dumps([fact["subject"]]),
                value=fact["value"],
                unit=fact["unit"],
                valid_from=fact["valid_from"],
                valid_to=fact["valid_to"],
                permitted_wording=fact["permitted_wording"],
                owner=fact.get("owner", "Operations"),
                source=fact.get("source", "Facts Register 2026"),
                status=fact.get("status", "active"),
                created_at=_make_timeline_timestamp(now, 55, 11, 0),
            )
            db.add(fact_model)

        # Glossary
        for g in kit_item.get("glossary", []):
            g_model = GlossaryTermModel(
                id=g["id"],
                workspace_id="ws-demo",
                kit_id=kit_item["id"],
                term=g["term"],
                preferred_casing=g["preferred_casing"],
                definition=g["definition"],
                created_at=_make_timeline_timestamp(now, 55, 11, 30),
            )
            db.add(g_model)

        # Claim Patterns
        for c in kit_item.get("claim_patterns", []):
            c_model = ClaimPatternModel(
                id=c["id"],
                workspace_id="ws-demo",
                kit_id=kit_item["id"],
                pattern=c["pattern"],
                category=c["category"],
                severity=c["severity"],
                substantiating_fact_id=c.get("substantiating_fact_id"),
                reason=c.get("reason", "Restricted claim pattern"),
                status=c.get("status", "active"),
                created_at=_make_timeline_timestamp(now, 55, 12, 0),
            )
            db.add(c_model)

    db.commit()

    # 6. Audit Trail Initialization
    audit_events: list[dict] = []
    audit_events.append(
        {
            "actor_id": "usr-meera",
            "actor_role": "Admin",
            "action": "workspace_created",
            "entity": "workspace",
            "entity_id": "ws-demo",
            "detail": {"name": "Demo Workspace", "industry": "Fictional Brands Demo"},
            "created_at": _make_timeline_timestamp(now, 56, 9, 0),
        }
    )
    audit_events.append(
        {
            "actor_id": "usr-meera",
            "actor_role": "Admin",
            "action": "ai_consent_granted",
            "entity": "ai_policy",
            "entity_id": "consent-v1.2",
            "detail": {"version": "v1.2-enterprise", "provider": "gemini"},
            "created_at": _make_timeline_timestamp(now, 56, 9, 5),
        }
    )
    for u in CAST_USERS:
        audit_events.append(
            {
                "actor_id": "usr-meera",
                "actor_role": "Admin",
                "action": "member_invited",
                "entity": "user",
                "entity_id": u["id"],
                "detail": {"email": u["email"], "role": u["role"].value},
                "created_at": _make_timeline_timestamp(now, 56, 9, 30),
            }
        )
    audit_events.append(
        {
            "actor_id": "usr-anika",
            "actor_role": "Brand manager",
            "action": "rule_proposal_created",
            "entity": "rule",
            "entity_id": "TERM-002-v2",
            "detail": {"version": "2.0", "summary": "Product casing clarification for blends"},
            "created_at": _make_timeline_timestamp(now, 10, 14, 0),
        }
    )

    # 7. Reviews Dataset (36 reviews: 22 Kettle & Co., 14 LedgerLeaf)
    # Story specs:
    # Status mix: 3 Draft, 4 AI-reviewed, 6 In human review (5 overdue >48h), 4 Changes requested, 14 Approved, 2 Rejected, 3 Exported
    # Overrides: Rohan overrides TERM-002 (4 times) and MSG-001 (2 times)
    # Contradictions on stale price: ₹299 (F-12-OLD) in weeks 1-4, ₹349 valid in weeks 5-8.
    # Total reviews = 36
    reviews_spec = _get_reviews_specification(now)

    active_rules = (
        db.query(RuleModel)
        .filter(RuleModel.workspace_id == "ws-demo", RuleModel.status == "active")
        .all()
    )
    active_facts = db.query(FactModel).filter(FactModel.workspace_id == "ws-demo").all()
    active_claims = (
        db.query(ClaimPatternModel)
        .filter(ClaimPatternModel.workspace_id == "ws-demo", ClaimPatternModel.status == "active")
        .all()
    )

    rules_dict = [
        {
            "id": r.id,
            "kit_id": r.kit_id,
            "category": r.category,
            "title": r.title,
            "text": r.text,
            "banned_terms": json.loads(r.banned_terms_json or "[]"),
            "preferred_replacement": r.preferred_replacement,
            "severity": r.severity,
            "version": r.version,
            "status": r.status,
        }
        for r in active_rules
    ]

    facts_dict = [
        {
            "id": f.id,
            "kit_id": f.kit_id,
            "subject": f.subject,
            "aliases": json.loads(f.aliases_json or "[]"),
            "value": f.value,
            "unit": f.unit,
            "valid_from": f.valid_from,
            "valid_to": f.valid_to,
            "permitted_wording": f.permitted_wording,
            "status": f.status,
        }
        for f in active_facts
    ]

    claims_dict = [
        {
            "id": c.id,
            "kit_id": c.kit_id,
            "pattern": c.pattern,
            "category": c.category,
            "severity": c.severity,
            "substantiating_fact_id": c.substantiating_fact_id,
            "reason": c.reason,
            "status": c.status,
        }
        for c in active_claims
    ]

    total_findings_count = 0
    total_decisions_count = 0
    total_comments_count = 0

    for idx, spec in enumerate(reviews_spec):
        rev_id = f"rev-demo-{idx + 1:03d}"
        created_at = spec["created_at"]
        author_id = spec["author_id"]
        assignee_id = spec.get("assignee_id")
        kit_id = spec["brand_kit_id"]
        content_type = spec["content_type"]
        final_status = spec["status"]

        # 1. Create ReviewModel
        p_card = PurposeCard(
            goal=spec.get("intent", "Promotional and educational campaign"),
            audience=spec.get("audience", "Loyal and prospective customers"),
            key_message=spec.get("takeaway", "Authentic brand quality"),
            call_to_action="Discover more at our official store",
            content_type=content_type,
            ai_declared=spec.get("ai_declared", True),
            locked_phrases=spec.get("locked_phrases", []),
        )

        review = ReviewModel(
            id=rev_id,
            workspace_id="ws-demo",
            kit_id=kit_id,
            status=final_status.value,
            content_type=content_type,
            purpose_card_json=p_card.model_dump_json(),
            ai_declared=spec.get("ai_declared", True),
            current_version=spec.get("versions_count", 1),
            created_by_role="Creator"
            if author_id in ("usr-priya", "usr-imran")
            else "Brand manager",
            creator_id=author_id,
            assignee_id=assignee_id,
            created_at=created_at,
            updated_at=created_at + timedelta(hours=spec.get("duration_hours", 2)),
        )
        db.add(review)

        audit_events.append(
            {
                "actor_id": author_id,
                "actor_role": "Creator",
                "action": "review_submitted",
                "entity": "review",
                "entity_id": rev_id,
                "detail": {
                    "brand_kit_id": kit_id,
                    "content_type": content_type,
                    "char_count": len(spec["draft_v1"]),
                },
                "created_at": created_at,
            }
        )

        # 2. Add Versions & Run Checks
        kit_rules = [r for r in rules_dict if r["kit_id"] == kit_id]
        kit_facts = [f for f in facts_dict if f["kit_id"] == kit_id]
        kit_claims = [c for c in claims_dict if c["kit_id"] == kit_id]

        v1 = ReviewVersionModel(
            id=f"ver-{rev_id}-1",
            review_id=rev_id,
            version=1,
            content=spec["draft_v1"],
            diff_from_previous=None,
            created_at=created_at,
        )
        db.add(v1)

        # Run checks on v1
        chk_ctx = CheckContext(
            text=spec["draft_v1"],
            rules=kit_rules,
            facts=kit_facts,
            purpose_card=p_card,
            claim_patterns=kit_claims,
            review_id=rev_id,
            version=1,
            content_type=content_type,
            ai_declared=spec.get("ai_declared", True),
            brand_kit_id=kit_id,
            kit_snapshot_version="1.0",
        )
        findings_v1 = run_deterministic_checks(chk_ctx)

        saved_findings = []
        for f in findings_v1:
            total_findings_count += 1
            f_model = FindingModel(
                id=f.id,
                review_id=rev_id,
                version=1,
                category=f.category,
                severity=f.severity.value,
                status=f.status.value,
                method=f.method.value,
                confidence=f.confidence,
                excerpt=f.excerpt,
                start=f.start,
                end=f.end,
                rule_id=f.rule_id,
                fact_id=f.fact_id,
                source_title=f.source_title,
                source_version=f.source_version,
                reason=f.reason,
                suggestion=f.suggestion,
                suggestion_check_json=f.suggestion_check.model_dump_json()
                if f.suggestion_check
                else None,
                created_at=created_at + timedelta(minutes=1),
            )
            db.add(f_model)
            saved_findings.append(f_model)

        # Multi-version handling (if revised)
        if spec.get("versions_count", 1) >= 2 and "draft_v2" in spec:
            v2_time = created_at + timedelta(hours=1)
            v2 = ReviewVersionModel(
                id=f"ver-{rev_id}-2",
                review_id=rev_id,
                version=2,
                content=spec["draft_v2"],
                diff_from_previous="Applied suggestions from version 1 review",
                created_at=v2_time,
            )
            db.add(v2)
            audit_events.append(
                {
                    "actor_id": author_id,
                    "actor_role": "Creator",
                    "action": "version_created",
                    "entity": "review_version",
                    "entity_id": v2.id,
                    "detail": {"review_id": rev_id, "version": 2},
                    "created_at": v2_time,
                }
            )

        # 3. Human Decisions on findings
        explicit_decisions = spec.get("decisions", [])
        handled_finding_indices = set()
        dec_seq = 0

        for _dec_i, dec in enumerate(explicit_decisions):
            target_f = None
            target_idx = -1
            if "rule_id" in dec:
                for idx_f, f in enumerate(saved_findings):
                    if f.rule_id == dec["rule_id"] and idx_f not in handled_finding_indices:
                        target_f = f
                        target_idx = idx_f
                        break
            if not target_f:
                for idx_f, f in enumerate(saved_findings):
                    if idx_f not in handled_finding_indices:
                        target_f = f
                        target_idx = idx_f
                        break

            if target_f and target_idx >= 0:
                handled_finding_indices.add(target_idx)
                dec_seq += 1
                action = dec["action"]
                actor_role = dec.get("actor_role", "Reviewer")
                dec_time = created_at + timedelta(minutes=15 + dec_seq * 5)
                actor_id = "usr-rohan" if kit_id == "kettle-and-co" else "usr-dev"
                if actor_role == "Brand manager":
                    actor_id = "usr-anika"
                elif actor_role == "Creator":
                    actor_id = author_id

                dec_model = DecisionModel(
                    id=f"dec-{rev_id}-{dec_seq}",
                    finding_id=target_f.id,
                    actor_role=actor_role,
                    action=action.value if hasattr(action, "value") else str(action),
                    reason=dec.get("reason"),
                    created_at=dec_time,
                )
                db.add(dec_model)
                total_decisions_count += 1

                audit_events.append(
                    {
                        "actor_id": actor_id,
                        "actor_role": actor_role,
                        "action": f"finding_{dec_model.action}",
                        "entity": "finding",
                        "entity_id": target_f.id,
                        "detail": {
                            "review_id": rev_id,
                            "rule_id": target_f.rule_id,
                            "reason": dec.get("reason"),
                        },
                        "created_at": dec_time,
                    }
                )

        # For Approved, Exported, Changes requested, or Rejected reviews, resolve findings with realistic human decisions
        if final_status in (
            ReviewStatus.APPROVED,
            ReviewStatus.EXPORTED,
            ReviewStatus.CHANGES_REQUESTED,
            ReviewStatus.REJECTED,
        ):
            for f_idx, target_f in enumerate(saved_findings):
                if f_idx in handled_finding_indices:
                    continue

                dec_seq += 1
                dec_time = created_at + timedelta(minutes=10 + dec_seq * 4)
                actor_id = "usr-rohan" if kit_id == "kettle-and-co" else "usr-dev"
                actor_role = "Reviewer"

                # Respect A6 narrative:
                # TERM-002: handled by explicit overrides in specs
                # CLAIM-4.2: never overridden!
                # MSG-001 / MSG-010: accepted
                if target_f.rule_id == "CLAIM-4.2":
                    action_val = DecisionAction.DISMISS
                    reason_val = (
                        "Verified with legal compliance lead that clinical claims are not present."
                    )
                elif target_f.severity == "Minor":
                    action_val = DecisionAction.ACCEPT
                    reason_val = "Accepted suggested phrasing."
                    actor_id = author_id
                    actor_role = "Creator"
                elif target_f.severity == "Info":
                    action_val = DecisionAction.DISMISS
                    reason_val = "Readability score acceptable for promotional format."
                else:
                    action_val = DecisionAction.ACCEPT
                    reason_val = "Verified and accepted in draft review."

                dec_model = DecisionModel(
                    id=f"dec-{rev_id}-{dec_seq}",
                    finding_id=target_f.id,
                    actor_role=actor_role,
                    action=action_val.value,
                    reason=reason_val,
                    created_at=dec_time,
                )
                db.add(dec_model)
                total_decisions_count += 1

                audit_events.append(
                    {
                        "actor_id": actor_id,
                        "actor_role": actor_role,
                        "action": f"finding_{action_val.value}",
                        "entity": "finding",
                        "entity_id": target_f.id,
                        "detail": {
                            "review_id": rev_id,
                            "rule_id": target_f.rule_id,
                            "reason": reason_val,
                        },
                        "created_at": dec_time,
                    }
                )

        # 4. Comments
        for c_idx, comm in enumerate(spec.get("comments", [])):
            comm_time = created_at + timedelta(minutes=20 + c_idx * 10)
            c_actor = comm["author_id"]
            c_actor_role = (
                "Reviewer"
                if c_actor in ("usr-rohan", "usr-dev")
                else ("Creator" if c_actor in ("usr-priya", "usr-imran") else "Brand manager")
            )
            c_model = CommentModel(
                id=f"com-{rev_id}-{c_idx + 1}",
                review_id=rev_id,
                author_id=c_actor,
                actor_role=c_actor_role,
                message=comm["message"],
                created_at=comm_time,
            )
            db.add(c_model)
            total_comments_count += 1
            audit_events.append(
                {
                    "actor_id": c_actor,
                    "actor_role": c_actor_role,
                    "action": "comment_added",
                    "entity": "review",
                    "entity_id": rev_id,
                    "detail": {"char_count": len(comm["message"])},
                    "created_at": comm_time,
                }
            )

        # 5. Approvals / Rejections / Changes requested
        if final_status in (ReviewStatus.APPROVED, ReviewStatus.EXPORTED):
            appr_time = created_at + timedelta(hours=spec.get("duration_hours", 2))
            appr_actor = (
                "usr-anika"
                if kit_id == "ledgerleaf" or "landing" in content_type.lower()
                else "usr-rohan"
            )
            appr_role = "Brand manager" if appr_actor == "usr-anika" else "Reviewer"
            appr = ApprovalModel(
                id=f"appr-{rev_id}-1",
                review_id=rev_id,
                role=appr_role,
                outcome="Approved",
                reason=spec.get("approval_reason", "All brand guidelines and facts verified."),
                created_at=appr_time,
            )
            db.add(appr)
            audit_events.append(
                {
                    "actor_id": appr_actor,
                    "actor_role": appr_role,
                    "action": "review_approved",
                    "entity": "review",
                    "entity_id": rev_id,
                    "detail": {"outcome": "Approved", "reason": appr.reason},
                    "created_at": appr_time,
                }
            )

        elif final_status == ReviewStatus.CHANGES_REQUESTED:
            appr_time = created_at + timedelta(hours=spec.get("duration_hours", 2))
            appr_actor = "usr-rohan" if kit_id == "kettle-and-co" else "usr-dev"
            appr = ApprovalModel(
                id=f"appr-{rev_id}-cr",
                review_id=rev_id,
                role="Reviewer",
                outcome="Changes requested",
                reason=spec.get("cr_reason", "Please resolve high-severity findings and resubmit."),
                created_at=appr_time,
            )
            db.add(appr)
            audit_events.append(
                {
                    "actor_id": appr_actor,
                    "actor_role": "Reviewer",
                    "action": "changes_requested",
                    "entity": "review",
                    "entity_id": rev_id,
                    "detail": {"outcome": "Changes requested", "reason": appr.reason},
                    "created_at": appr_time,
                }
            )

        elif final_status == ReviewStatus.REJECTED:
            appr_time = created_at + timedelta(hours=spec.get("duration_hours", 2))
            appr = ApprovalModel(
                id=f"appr-{rev_id}-rej",
                review_id=rev_id,
                role="Brand manager",
                outcome="Rejected",
                reason=spec.get(
                    "reject_reason", "Severe non-compliance with statutory regulations."
                ),
                created_at=appr_time,
            )
            db.add(appr)
            audit_events.append(
                {
                    "actor_id": "usr-anika",
                    "actor_role": "Brand manager",
                    "action": "review_rejected",
                    "entity": "review",
                    "entity_id": rev_id,
                    "detail": {"outcome": "Rejected", "reason": appr.reason},
                    "created_at": appr_time,
                }
            )

        # 6. AI Disclosure Ledger entries
        # 60% Gemini, 15% confidential mode, remainder deterministic
        ai_mode = spec.get("ai_mode", "gemini")
        if ai_mode == "gemini":
            disc = DisclosureLedgerModel(
                id=f"disc-{rev_id}-1",
                workspace_id="ws-demo",
                review_id=rev_id,
                provider="Gemini",
                model="gemini-1.5-pro",
                key_type="workspace_managed",
                data_class="promotional_draft",
                pii_redacted=True,
                token_count=RNG.randint(180, 360),
                created_at=created_at + timedelta(seconds=12),
            )
            db.add(disc)
        elif ai_mode == "confidential":
            disc = DisclosureLedgerModel(
                id=f"disc-{rev_id}-conf",
                workspace_id="ws-demo",
                review_id=rev_id,
                provider="Offline Deterministic Engine",
                model="no external call",
                key_type="none",
                data_class="internal_confidential",
                pii_redacted=True,
                token_count=0,
                created_at=created_at + timedelta(seconds=5),
            )
            db.add(disc)

    db.commit()

    # 8. Notifications Dataset (2 to 6 per cast member, 1 to 3 unread)
    notifications_spec = _get_notifications_specification(now)
    for n_idx, notif in enumerate(notifications_spec):
        notif_model = NotificationModel(
            id=f"notif-demo-{n_idx + 1:03d}",
            workspace_id="ws-demo",
            user_id=notif["user_id"],
            type=notif["type"],
            title=notif["title"],
            body=notif["body"],
            link=notif["link"],
            is_read=notif["is_read"],
            created_at=notif["created_at"],
        )
        db.add(notif_model)
    db.commit()

    # 9. Commit Hash-Chained Audit Trail
    # Sort chronologically to preserve immutable ordering
    audit_events.sort(key=lambda x: x["created_at"])
    for _seq, a in enumerate(audit_events, start=1):
        clean_detail = {
            k: v for k, v in a["detail"].items() if k not in ("content", "text", "prompt", "draft")
        }
        log_entry = AuditLogModel(
            workspace_id="ws-demo",
            actor_id=a["actor_id"],
            actor_role=a["actor_role"],
            action=a["action"],
            entity=a["entity"],
            entity_id=a["entity_id"],
            detail_json=json.dumps(clean_detail),
            created_at=a["created_at"],
        )
        db.add(log_entry)

    db.commit()

    return {
        "reviews": len(reviews_spec),
        "findings": total_findings_count,
        "decisions": total_decisions_count,
        "comments": total_comments_count,
        "audit_events": len(audit_events),
        "notifications": len(notifications_spec),
    }


def wipe_demo_workspace(db: Session) -> None:
    """Safely wipe all entities associated with 'ws-demo' in proper dependency order."""
    # Find all review IDs in ws-demo
    demo_reviews = db.query(ReviewModel.id).filter(ReviewModel.workspace_id == "ws-demo").all()
    rev_ids = [r[0] for r in demo_reviews]

    if rev_ids:
        # Decisions for findings of these reviews
        demo_findings = db.query(FindingModel.id).filter(FindingModel.review_id.in_(rev_ids)).all()
        find_ids = [f[0] for f in demo_findings]
        if find_ids:
            db.query(DecisionModel).filter(DecisionModel.finding_id.in_(find_ids)).delete(
                synchronize_session=False
            )

        db.query(FindingModel).filter(FindingModel.review_id.in_(rev_ids)).delete(
            synchronize_session=False
        )
        db.query(ReviewVersionModel).filter(ReviewVersionModel.review_id.in_(rev_ids)).delete(
            synchronize_session=False
        )
        db.query(ApprovalModel).filter(ApprovalModel.review_id.in_(rev_ids)).delete(
            synchronize_session=False
        )
        db.query(CommentModel).filter(CommentModel.review_id.in_(rev_ids)).delete(
            synchronize_session=False
        )

    db.query(ReviewModel).filter(ReviewModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(AuditLogModel).filter(AuditLogModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(DisclosureLedgerModel).filter(DisclosureLedgerModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(NotificationModel).filter(NotificationModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )

    # Brand elements
    db.query(ClaimPatternModel).filter(ClaimPatternModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(GlossaryTermModel).filter(GlossaryTermModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(FactModel).filter(FactModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(RuleModel).filter(RuleModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(BrandKitModel).filter(BrandKitModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(ContentTypeModel).filter(ContentTypeModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(MembershipModel).filter(MembershipModel.workspace_id == "ws-demo").delete(
        synchronize_session=False
    )
    db.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").delete(
        synchronize_session=False
    )
    db.commit()


def _get_reviews_specification(now: datetime) -> list[dict]:
    """Return exactly 36 review definitions telling the cohesive 8-week story."""
    # Mix:
    # 3 Draft
    # 4 AI-reviewed
    # 6 In human review (5 overdue >48h)
    # 4 Changes requested
    # 14 Approved
    # 2 Rejected
    # 3 Exported
    # Total = 36 (Kettle & Co: 22, LedgerLeaf: 14)
    specs = [
        # --- 14 APPROVED REVIEWS ---
        # 1. KC Approved - Clean tea announcement (Week 7)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 50, 11, 0),
            "draft_v1": "Wake up to an authentic morning cup of Masala Chai from Kettle & Co., freshly harvested from certified 100% Upper Assam tea estates. Enjoy ₹349 for 250g pouch with free pan-India delivery on orders above ₹499. Offer valid while stocks last. T&Cs apply.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-rohan",
                    "message": "@Priya Clean copy, compliant with price update and mandatory promo disclaimer. Approved.",
                }
            ],
            "approval_reason": "Verified pricing and origin certification.",
            "ai_mode": "gemini",
        },
        # 2. KC Approved - Social post with override on casing (Week 6)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Social post",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 44, 15, 30),
            "draft_v1": "Nothing beats a strong afternoon brew of masala chai when the rain hits Mumbai. Kettle & Co. artisanal tea brings the estate experience directly to your kitchen counter.",
            "decisions": [
                {
                    "rule_id": "TERM-002",
                    "action": DecisionAction.OVERRIDE,
                    "actor_role": "Reviewer",
                    "reason": "Lower case acceptable in casual tweet context",
                }
            ],
            "comments": [
                {
                    "author_id": "usr-priya",
                    "message": "@Rohan Kept 'masala chai' lowercase for conversational Twitter voice.",
                },
                {
                    "author_id": "usr-rohan",
                    "message": "Makes sense for casual tweet tone. Overriding casing rule for this post.",
                },
            ],
            "approval_reason": "Approved with casing exception for social media brevity.",
            "ai_mode": "gemini",
        },
        # 3. KC Approved - Festive Bundle (Week 5)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Landing page",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 38, 10, 15),
            "draft_v1": "Discover the Festive Monsoon Trio Bundle at ₹799. Featuring our signature Masala Chai and Darjeeling Second Flush loose leaf. Steep for 4-5 minutes in fresh water at 95°C. Offer valid while stocks last. T&Cs apply.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-anika",
                    "message": "Manager sign-off completed for landing page launch.",
                }
            ],
            "approval_reason": "All bundle facts and steeping instructions match brand registry.",
            "ai_mode": "gemini",
        },
        # 4. LL Approved - Brokerage & Demat account (Week 6)
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Landing page",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 42, 14, 0),
            "draft_v1": "Open your free Demat account with LedgerLeaf Pro in under 5 minutes. Enjoy zero account maintenance charges for the first 12 months. SEBI Registration Number INZ000293431. Investments in securities market are subject to market risks. Read all scheme related documents carefully before investing.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-dev",
                    "message": "@Imran Compliant. Statutory risk disclaimer and SEBI number verified.",
                }
            ],
            "approval_reason": "Compliance review passed with official SEBI registration disclaimer.",
            "ai_mode": "confidential",
        },
        # 5. LL Approved - SmartVault Savings (Week 5)
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Promotional email",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 35, 11, 45),
            "draft_v1": "Grow your idle cash with SmartVault. Your bank deposits insured up to ₹5,00,000 by DICGC with partner scheduled commercial banks. Instant withdrawals processed to verified UPI bank accounts in under 15 minutes. LedgerLeaf never asks for your OTP, PIN, or password.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-dev",
                    "message": "Insurance limits and OTP warning correctly positioned.",
                }
            ],
            "approval_reason": "Approved by compliance team.",
            "ai_mode": "gemini",
        },
        # 6. KC Approved - Weekend Newsletter (Week 4)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 31, 12, 0),
            "draft_v1": "Experience the warmth of artisanal Masala Chai by Kettle & Co. Hand-blended with whole spices and CTC black tea. ₹349 for 250g pouch.",
            "decisions": [
                {
                    "rule_id": "MSG-001",
                    "action": DecisionAction.OVERRIDE,
                    "actor_role": "Reviewer",
                    "reason": "Mandatory disclaimer present on landing page linked in campaign",
                }
            ],
            "comments": [
                {
                    "author_id": "usr-priya",
                    "message": "@Rohan Updated the free shipping tier to ₹499.",
                },
                {"author_id": "usr-rohan", "message": "Approved. Price and threshold confirmed."},
            ],
            "approval_reason": "Compliant.",
            "ai_mode": "gemini",
        },
        # 7. KC Approved - Darjeeling Muscatel Notes (Week 4)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Social post",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 28, 16, 20),
            "draft_v1": "Summer sun brings out the muscatel notes in our Darjeeling Second Flush. Limited harvest batch. Subject to availability. Brew with Kettle & Co. for mindful moments.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-anika",
                    "message": "Second flush harvest notes verified against tea board certificate.",
                },
                {"author_id": "usr-rohan", "message": "Approved."},
            ],
            "approval_reason": "Seasonal disclosure included.",
            "ai_mode": "gemini",
        },
        # 8. LL Approved - Pro Plan Subscription (Week 3)
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Promotional email",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 24, 10, 30),
            "draft_v1": "Unlock advanced tax harvesting and multi-broker analytics with LedgerLeaf Pro. Upgrade today for ₹999 per year for LedgerLeaf Pro. LedgerLeaf never asks for your OTP, PIN, or password.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-imran",
                    "message": "@Dev Confirming that Pro pricing reflects ₹999 rate.",
                },
                {"author_id": "usr-dev", "message": "Pricing confirmed and OTP notice verified."},
            ],
            "approval_reason": "Approved.",
            "ai_mode": "gemini",
        },
        # 9. KC Approved - Packaging Net Wt Update (Week 3)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Press note",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-anika",
            "created_at": _make_timeline_timestamp(now, 21, 15, 0),
            "draft_v1": "Kettle & Co. announces eco-friendly pouches with clear Net Wt. 250g labeling across all Masala Chai retail distributions.",
            "decisions": [],
            "comments": [{"author_id": "usr-meera", "message": "Verified by operations."}],
            "approval_reason": "Approved.",
            "ai_mode": "gemini",
        },
        # 10. LL Approved - App push notification (Week 2)
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "App notification",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 17, 13, 0),
            "draft_v1": "Your monthly portfolio dividends have arrived in SmartVault. Withdrawals processed to verified UPI bank accounts in under 15 minutes.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-imran",
                    "message": "@Dev Notification character count is under 120 characters.",
                },
                {
                    "author_id": "usr-dev",
                    "message": "Approved for instant push notification dispatch.",
                },
            ],
            "approval_reason": "Approved.",
            "ai_mode": "confidential",
        },
        # 11. KC Approved - Brewing Guide copy (Week 2)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Social post",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 14, 11, 0),
            "draft_v1": "The secret to real chai? Steep for 4-5 minutes in fresh water at 95°C. Pair with milk and jaggery. Crafted with love by Kettle & Co.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-priya",
                    "message": "Brewing temperature aligned with brewmaster guidelines.",
                },
                {"author_id": "usr-rohan", "message": "Approved."},
            ],
            "approval_reason": "Approved.",
            "ai_mode": "gemini",
        },
        # 12. KC Approved - Packaging Seal Security (Week 1)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 9, 14, 30),
            "draft_v1": "Artisanal tea preserved at peak aroma: Kettle & Co. Masala Chai now ships in airtight foil pouches. ₹349 for 250g pouch. Offer valid while stocks last. T&Cs apply.",
            "decisions": [],
            "comments": [
                {"author_id": "usr-priya", "message": "Updated packaging security copy."},
                {"author_id": "usr-rohan", "message": "Security wording approved."},
            ],
            "approval_reason": "Security wording approved.",
            "ai_mode": "gemini",
        },
        # 13. KC Approved - Second casing override by Rohan (Week 1)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Social post",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 7, 10, 0),
            "draft_v1": "Pour a piping hot cup of masala chai to kickstart your Tuesday. Pure artisanal bliss from Kettle & Co.",
            "decisions": [
                {
                    "rule_id": "TERM-002",
                    "action": DecisionAction.OVERRIDE,
                    "actor_role": "Reviewer",
                    "reason": "Social post casing allowed",
                }
            ],
            "comments": [
                {"author_id": "usr-rohan", "message": "Override applied for social handle."}
            ],
            "approval_reason": "Approved with exception.",
            "ai_mode": "gemini",
        },
        # 14. LL Approved - Mutual Fund advisory note (Week 1)
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Landing page",
            "status": ReviewStatus.APPROVED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 5, 16, 0),
            "draft_v1": "Explore index funds curated by LedgerLeaf Pro. Algorithmic calculation for informational purposes only, not personalized investment advice. Investments in securities market are subject to market risks. Read all scheme related documents carefully before investing.",
            "decisions": [],
            "comments": [
                {"author_id": "usr-dev", "message": "Statutory warning confirmed."},
                {"author_id": "usr-anika", "message": "Final sign-off complete."},
            ],
            "approval_reason": "Approved.",
            "ai_mode": "gemini",
        },
        # --- 3 EXPORTED REVIEWS (Approved with audit certificates) ---
        # 15. KC Exported - Diwali Gift Box
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.EXPORTED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 26, 11, 0),
            "draft_v1": "Gift the warmth of Indian tradition with the Kettle & Co. Festive Monsoon Trio Bundle at ₹799. Includes signature Masala Chai.",
            "decisions": [
                {
                    "rule_id": "MSG-001",
                    "action": DecisionAction.OVERRIDE,
                    "actor_role": "Reviewer",
                    "reason": "T&C link included in email header banner",
                }
            ],
            "comments": [
                {
                    "author_id": "usr-anika",
                    "message": "@Meera Ready for external email service dispatch.",
                },
                {"author_id": "usr-rohan", "message": "Export certificate generated."},
            ],
            "approval_reason": "Exported to production CMS.",
            "ai_mode": "gemini",
        },
        # 16. LL Exported - Annual Financial Report summary
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Press note",
            "status": ReviewStatus.EXPORTED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 20, 14, 0),
            "draft_v1": "LedgerLeaf Pro crosses 250,000 verified Demat accounts under SEBI Registration Number INZ000293431. Bank deposits insured up to ₹5,00,000 by DICGC.",
            "decisions": [],
            "comments": [{"author_id": "usr-anika", "message": "Approved for media wire release."}],
            "approval_reason": "Exported with cryptographic certificate.",
            "ai_mode": "gemini",
        },
        # 17. KC Exported - Assam Estate Harvest Notes
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Landing page",
            "status": ReviewStatus.EXPORTED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 15, 12, 0),
            "draft_v1": "Harvested from certified 100% Upper Assam tea estates. Kettle & Co. Masala Chai is packaged fresh for unmatched aroma and body.",
            "decisions": [],
            "comments": [{"author_id": "usr-anika", "message": "Verified and exported."}],
            "approval_reason": "Exported.",
            "ai_mode": "gemini",
        },
        # --- 4 CHANGES REQUESTED REVIEWS ---
        # 18. KC Changes requested - Medical Claim violation
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.CHANGES_REQUESTED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 12, 10, 0),
            "draft_v1": "Try our new wellness blend. This tea can cure digestive ailments and detox your morning routine. Get Masala Chai today.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-rohan",
                    "message": "@Priya Blocker violation on CLAIM-4.2: FSSAI strictly prohibits health and 'cure' claims without clinical trials. Please remove 'cure' and 'detox'.",
                }
            ],
            "cr_reason": "Remove curative health claims.",
            "ai_mode": "gemini",
        },
        # 19. LL Changes requested - Missing SEBI Disclaimer
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Landing page",
            "status": ReviewStatus.CHANGES_REQUESTED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 8, 11, 30),
            "draft_v1": "Discover equity investments with LedgerLeaf Pro. Diversify your mutual funds portfolio and track stock yields in real-time.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-dev",
                    "message": "@Imran You mentioned equities and mutual funds without the mandatory SEBI risk disclaimer. Please add MSG-010 before we can approve.",
                }
            ],
            "cr_reason": "Missing mandatory SEBI risk notice.",
            "ai_mode": "gemini",
        },
        # 20. KC Changes requested - Banned promotional superlative
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Social post",
            "status": ReviewStatus.CHANGES_REQUESTED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 6, 14, 0),
            "draft_v1": "Buy the best in the world Masala Chai from Kettle & Co. today at the cheapest tea price in India!",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-rohan",
                    "message": "@Priya Terminology and claims violations: 'best in the world' and 'cheapest tea' are prohibited by brand guidelines.",
                }
            ],
            "cr_reason": "Revise superlatives and pricing claims.",
            "ai_mode": "gemini",
        },
        # 21. LL Changes requested - Missing OTP security warning
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Promotional email",
            "status": ReviewStatus.CHANGES_REQUESTED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 4, 15, 0),
            "draft_v1": "Sign in to verify your SmartVault bank account and link your UPI ID for instant processing.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-dev",
                    "message": "@Imran Security rule MSG-011 requires the OTP reminder on account verification emails.",
                }
            ],
            "cr_reason": "Add mandatory security reminder.",
            "ai_mode": "confidential",
        },
        # --- 2 REJECTED REVIEWS ---
        # 22. LL Rejected - Guaranteed Returns Violation (Severe Blocker)
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Social post",
            "status": ReviewStatus.REJECTED,
            "author_id": "usr-imran",
            "created_at": _make_timeline_timestamp(now, 22, 16, 0),
            "draft_v1": "Get guaranteed returns of 18% with our foolproof strategy on LedgerLeaf Pro! Zero risk guarantee for all new retail investors.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-dev",
                    "message": "@Imran Critical compliance hazard. Promising guaranteed returns violates SEBI regulations directly.",
                },
                {
                    "author_id": "usr-anika",
                    "message": "Rejected outright. Predatory promises are strictly forbidden.",
                },
            ],
            "reject_reason": "Severe regulatory violation: SEBI prohibits promising guaranteed returns.",
            "ai_mode": "gemini",
        },
        # 23. KC Rejected - Miracle Cure Claims
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Press note",
            "status": ReviewStatus.REJECTED,
            "author_id": "usr-priya",
            "created_at": _make_timeline_timestamp(now, 18, 17, 0),
            "draft_v1": "Kettle & Co. reveals miracle cure tea formulation clinically proven to reverse fatigue and boost metabolism.",
            "decisions": [],
            "comments": [
                {"author_id": "usr-rohan", "message": "Unsubstantiated medical claims."},
                {
                    "author_id": "usr-anika",
                    "message": "Brand council policy forbids uncertified clinical claims. Rejected.",
                },
            ],
            "reject_reason": "Unapproved clinical efficacy claims.",
            "ai_mode": "gemini",
        },
        # --- 6 IN HUMAN REVIEW (5 overdue >48h SLA) ---
        # 24. Overdue 1: KC (Submitted 7 days ago - Overdue)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.IN_HUMAN_REVIEW,
            "author_id": "usr-priya",
            "assignee_id": "usr-rohan",
            "created_at": _make_timeline_timestamp(now, 7, 11, 0),
            "draft_v1": "Celebrate monsoon evenings with Kettle and Co. Authentic masala chai crafted with cardamom and clove. Free delivery on orders above ₹499. Offer valid while stocks last. T&Cs apply.",
            "decisions": [
                {
                    "rule_id": "TERM-002",
                    "action": DecisionAction.OVERRIDE,
                    "actor_role": "Reviewer",
                    "reason": "Headline typography styling exception approved",
                }
            ],
            "comments": [
                {
                    "author_id": "usr-priya",
                    "message": "@Rohan Pending review for over 5 days. Could you approve the casing?",
                }
            ],
            "ai_mode": "gemini",
        },
        # 25. Overdue 2: KC (Submitted 5 days ago - Overdue)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Landing page",
            "status": ReviewStatus.IN_HUMAN_REVIEW,
            "author_id": "usr-priya",
            "assignee_id": "usr-rohan",
            "created_at": _make_timeline_timestamp(now, 5, 14, 0),
            "draft_v1": "Order your favourite Masala Chai blend from Kettle & Co. Special offer: ₹299 for 250g pouch. Limited harvest batch. Subject to availability.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-rohan",
                    "message": "@Priya Notice: ₹299 contradicts active price fact F-12 (₹349). Checking with Anika.",
                }
            ],
            "ai_mode": "gemini",
        },
        # 26. Overdue 3: LL (Submitted 4 days ago - Overdue)
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Landing page",
            "status": ReviewStatus.IN_HUMAN_REVIEW,
            "author_id": "usr-imran",
            "assignee_id": "usr-dev",
            "created_at": _make_timeline_timestamp(now, 4, 11, 0),
            "draft_v1": "Upgrade to LedgerLeaf Pro for ₹799 per year. Automate your tax deductions and track expenses. Investments in securities market are subject to market risks. Read all scheme related documents carefully before investing.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-dev",
                    "message": "@Imran Price ₹799 is the old superseded rate. Active rate is ₹999.",
                }
            ],
            "ai_mode": "gemini",
        },
        # 27. Overdue 4: KC (Submitted 3 days ago - Overdue)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Social post",
            "status": ReviewStatus.IN_HUMAN_REVIEW,
            "author_id": "usr-priya",
            "assignee_id": "usr-rohan",
            "created_at": _make_timeline_timestamp(now, 3, 16, 0),
            "draft_v1": "Crisp autumn weather calls for a steaming cup of masala chai from Kettle and Co. Single estate teas roasted to perfection.",
            "decisions": [
                {
                    "rule_id": "TERM-002",
                    "action": DecisionAction.OVERRIDE,
                    "actor_role": "Reviewer",
                    "reason": "Short-form character limit exception",
                }
            ],
            "comments": [{"author_id": "usr-priya", "message": "@Rohan Awaiting your sign-off."}],
            "ai_mode": "gemini",
        },
        # 28. Overdue 5: LL (Submitted 3 days ago - Overdue)
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "App notification",
            "status": ReviewStatus.IN_HUMAN_REVIEW,
            "author_id": "usr-imran",
            "assignee_id": "usr-dev",
            "created_at": _make_timeline_timestamp(now, 3, 10, 0),
            "draft_v1": "SmartVault notice: instant withdrawals processed to verified UPI bank accounts in under 15 minutes. Deposit insurance up to ₹5,00,000.",
            "decisions": [],
            "comments": [{"author_id": "usr-dev", "message": "Reviewing."}],
            "ai_mode": "confidential",
        },
        # 29. Fresh In Human Review: KC (Submitted 12 hours ago - NOT overdue)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.IN_HUMAN_REVIEW,
            "author_id": "usr-priya",
            "assignee_id": "usr-rohan",
            "created_at": now - timedelta(hours=12),
            "draft_v1": "Fresh harvest announcement: Kettle & Co. Masala Chai is back in stock. ₹349 for 250g pouch. Free pan-India delivery on orders above ₹499. Offer valid while stocks last. T&Cs apply.",
            "decisions": [],
            "comments": [
                {
                    "author_id": "usr-priya",
                    "message": "@Rohan Just submitted for weekend newsletter dispatch.",
                }
            ],
            "ai_mode": "gemini",
        },
        # --- 4 AI-REVIEWED REVIEWS ---
        # 30. AI-reviewed KC
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.AI_REVIEWED,
            "author_id": "usr-priya",
            "created_at": now - timedelta(hours=8),
            "draft_v1": "Enjoy our artisanal Masala Chai blend from Kettle & Co. ₹349 for 250g pouch. Steep for 4-5 minutes in fresh water at 95°C. Offer valid while stocks last. T&Cs apply.",
            "decisions": [],
            "comments": [],
            "ai_mode": "gemini",
        },
        # 31. AI-reviewed LL
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Promotional email",
            "status": ReviewStatus.AI_REVIEWED,
            "author_id": "usr-imran",
            "created_at": now - timedelta(hours=6),
            "draft_v1": "Plan your tax savings with LedgerLeaf Pro for ₹999 per year. Demat account with zero AMC charges. Investments in securities market are subject to market risks. Read all scheme related documents carefully before investing.",
            "decisions": [],
            "comments": [],
            "ai_mode": "gemini",
        },
        # 32. AI-reviewed KC (confidential mode check)
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Social post",
            "status": ReviewStatus.AI_REVIEWED,
            "author_id": "usr-priya",
            "created_at": now - timedelta(hours=4),
            "draft_v1": "Malty notes and pure whole spices. Kettle & Co. Masala Chai brings the authentic bazaar aroma right to your table.",
            "decisions": [],
            "comments": [],
            "ai_mode": "confidential",
        },
        # 33. AI-reviewed LL
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "App notification",
            "status": ReviewStatus.AI_REVIEWED,
            "author_id": "usr-imran",
            "created_at": now - timedelta(hours=3),
            "draft_v1": "Your SmartVault monthly yield report is ready in LedgerLeaf Pro. Remember: LedgerLeaf never asks for your OTP, PIN, or password.",
            "decisions": [],
            "comments": [],
            "ai_mode": "gemini",
        },
        # --- 3 DRAFT REVIEWS ---
        # 34. Draft KC
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Promotional email",
            "status": ReviewStatus.DRAFT,
            "author_id": "usr-priya",
            "created_at": now - timedelta(hours=2),
            "draft_v1": "Drafting our winter gift guide: Masala Chai and single estate ginger infusions from Kettle & Co.",
            "decisions": [],
            "comments": [],
            "ai_mode": "none",
        },
        # 35. Draft LL
        {
            "brand_kit_id": "ledgerleaf",
            "content_type": "Landing page",
            "status": ReviewStatus.DRAFT,
            "author_id": "usr-imran",
            "created_at": now - timedelta(hours=1),
            "draft_v1": "Early draft for smart SIP calculator: calculate annualized returns and portfolio compounding with LedgerLeaf Pro.",
            "decisions": [],
            "comments": [],
            "ai_mode": "none",
        },
        # 36. Draft KC
        {
            "brand_kit_id": "kettle-and-co",
            "content_type": "Social post",
            "status": ReviewStatus.DRAFT,
            "author_id": "usr-priya",
            "created_at": now - timedelta(minutes=30),
            "draft_v1": "A warm cup of Kettle & Co. tea on a cloudy morning. Simple ingredients, honest flavor.",
            "decisions": [],
            "comments": [],
            "ai_mode": "none",
        },
    ]

    return specs


def _get_notifications_specification(now: datetime) -> list[dict]:
    """Targeted notifications for each cast persona (2-6 items, 1-3 unread)."""
    return [
        # Priya (Creator) - 4 notifications
        {
            "user_id": "usr-priya",
            "type": "approval",
            "title": "Review Approved",
            "body": "Rohan Mehta approved your email draft: 'Experience the warmth of artisanal Masala Chai'.",
            "link": "/app/review/rev-demo-001",
            "is_read": True,
            "created_at": now - timedelta(days=5),
        },
        {
            "user_id": "usr-priya",
            "type": "mention",
            "title": "@Rohan Mehta mentioned you",
            "body": "@Priya Kept 'masala chai' lowercase for conversational Twitter voice.",
            "link": "/app/review/rev-demo-002",
            "is_read": True,
            "created_at": now - timedelta(days=3),
        },
        {
            "user_id": "usr-priya",
            "type": "changes_requested",
            "title": "Changes Requested",
            "body": "Rohan Mehta requested changes on 'Try our new wellness blend': Remove curative health claims.",
            "link": "/app/review/rev-demo-018",
            "is_read": False,
            "created_at": now - timedelta(days=2),
        },
        {
            "user_id": "usr-priya",
            "type": "assignment",
            "title": "Review In Human Review",
            "body": "Your weekend email draft is now assigned to Rohan Mehta.",
            "link": "/app/review/rev-demo-029",
            "is_read": False,
            "created_at": now - timedelta(hours=10),
        },
        # Imran (Creator) - 4 notifications
        {
            "user_id": "usr-imran",
            "type": "approval",
            "title": "Review Approved",
            "body": "Dev Malhotra approved 'Grow your idle cash with SmartVault'.",
            "link": "/app/review/rev-demo-005",
            "is_read": True,
            "created_at": now - timedelta(days=6),
        },
        {
            "user_id": "usr-imran",
            "type": "changes_requested",
            "title": "Changes Requested",
            "body": "Dev Malhotra requested statutory SEBI disclaimer on landing page draft.",
            "link": "/app/review/rev-demo-019",
            "is_read": False,
            "created_at": now - timedelta(days=3),
        },
        {
            "user_id": "usr-imran",
            "type": "rejection",
            "title": "Review Rejected",
            "body": "Anika Rao rejected 'Get guaranteed returns of 18%': Regulatory violation.",
            "link": "/app/review/rev-demo-022",
            "is_read": True,
            "created_at": now - timedelta(days=8),
        },
        {
            "user_id": "usr-imran",
            "type": "mention",
            "title": "@Dev Malhotra commented",
            "body": "@Imran Price ₹799 is superseded. Active annual subscription is ₹999.",
            "link": "/app/review/rev-demo-026",
            "is_read": False,
            "created_at": now - timedelta(days=1),
        },
        # Rohan (Reviewer) - 5 notifications
        {
            "user_id": "usr-rohan",
            "type": "assignment",
            "title": "Review Assigned to You",
            "body": "Priya Nair submitted a new draft: 'Fresh harvest announcement'.",
            "link": "/app/review/rev-demo-029",
            "is_read": False,
            "created_at": now - timedelta(hours=11),
        },
        {
            "user_id": "usr-rohan",
            "type": "overdue",
            "title": "SLA Alert: Overdue Review",
            "body": "Review rev-demo-024 has exceeded the 48-hour workspace SLA.",
            "link": "/app/review/rev-demo-024",
            "is_read": False,
            "created_at": now - timedelta(days=1),
        },
        {
            "user_id": "usr-rohan",
            "type": "mention",
            "title": "@Priya Nair mentioned you",
            "body": "@Rohan Kept 'masala chai' lowercase for conversational Twitter voice.",
            "link": "/app/review/rev-demo-002",
            "is_read": True,
            "created_at": now - timedelta(days=4),
        },
        {
            "user_id": "usr-rohan",
            "type": "rule_proposal",
            "title": "Rule Clarification Proposed",
            "body": "Anika Rao drafted TERM-002 v2 regarding blend casing.",
            "link": "/app/hub?kit=kettle-and-co&rule=TERM-002-v2",
            "is_read": True,
            "created_at": now - timedelta(days=10),
        },
        {
            "user_id": "usr-rohan",
            "type": "overdue",
            "title": "SLA Alert: Overdue Review",
            "body": "Review rev-demo-025 is waiting for your review.",
            "link": "/app/review/rev-demo-025",
            "is_read": False,
            "created_at": now - timedelta(hours=18),
        },
        # Dev (Reviewer) - 4 notifications
        {
            "user_id": "usr-dev",
            "type": "assignment",
            "title": "Review Assigned to You",
            "body": "Imran Sheikh submitted 'SmartVault notice: instant withdrawals'.",
            "link": "/app/review/rev-demo-028",
            "is_read": False,
            "created_at": now - timedelta(days=2),
        },
        {
            "user_id": "usr-dev",
            "type": "overdue",
            "title": "SLA Alert: Overdue Review",
            "body": "Review rev-demo-026 has exceeded the 48-hour SLA threshold.",
            "link": "/app/review/rev-demo-026",
            "is_read": False,
            "created_at": now - timedelta(days=1),
        },
        {
            "user_id": "usr-dev",
            "type": "mention",
            "title": "@Imran Sheikh replied",
            "body": "@Dev Added SEBI disclaimer and updated risk note.",
            "link": "/app/review/rev-demo-004",
            "is_read": True,
            "created_at": now - timedelta(days=5),
        },
        {
            "user_id": "usr-dev",
            "type": "security",
            "title": "Compliance Log Verified",
            "body": "Daily audit cryptographic chain verification completed successfully.",
            "link": "/app/audit",
            "is_read": True,
            "created_at": now - timedelta(days=7),
        },
        # Anika (Brand manager) - 5 notifications
        {
            "user_id": "usr-anika",
            "type": "approval_gate",
            "title": "Manager Sign-off Required",
            "body": "Landing page review rev-demo-003 requires Brand Manager approval.",
            "link": "/app/review/rev-demo-003",
            "is_read": True,
            "created_at": now - timedelta(days=4),
        },
        {
            "user_id": "usr-anika",
            "type": "rule_clarification",
            "title": "High Override Ambiguity Detected",
            "body": "TERM-002 has reached a 57% override rate. Proposal v2 drafted.",
            "link": "/app/insights",
            "is_read": False,
            "created_at": now - timedelta(days=2),
        },
        {
            "user_id": "usr-anika",
            "type": "rejection_notice",
            "title": "Content Rejected",
            "body": "You rejected rev-demo-022 for guaranteed return claim.",
            "link": "/app/review/rev-demo-022",
            "is_read": True,
            "created_at": now - timedelta(days=8),
        },
        {
            "user_id": "usr-anika",
            "type": "fact_expiry",
            "title": "Fact Expiring Soon",
            "body": "F-17 'Festive Monsoon Bundle Pricing' expires in 13 days.",
            "link": "/app/hub?kit=kettle-and-co",
            "is_read": False,
            "created_at": now - timedelta(hours=6),
        },
        {
            "user_id": "usr-anika",
            "type": "export",
            "title": "Certificate Generated",
            "body": "Cryptographic export certificate issued for rev-demo-015.",
            "link": "/app/review/rev-demo-015",
            "is_read": True,
            "created_at": now - timedelta(days=12),
        },
        # Meera (Admin) - 3 notifications
        {
            "user_id": "usr-meera",
            "type": "team",
            "title": "All Team Members Onboarded",
            "body": "6 members have active roles in Demo Workspace.",
            "link": "/app/team",
            "is_read": True,
            "created_at": now - timedelta(days=50),
        },
        {
            "user_id": "usr-meera",
            "type": "audit_integrity",
            "title": "Audit Chain Verification Passed",
            "body": "Audit log hash chain verified with zero integrity breaks.",
            "link": "/app/audit",
            "is_read": False,
            "created_at": now - timedelta(hours=12),
        },
        {
            "user_id": "usr-meera",
            "type": "retention",
            "title": "Workspace Retention Policy Active",
            "body": "90-day retention schedule configured.",
            "link": "/app/settings",
            "is_read": True,
            "created_at": now - timedelta(days=15),
        },
    ]
