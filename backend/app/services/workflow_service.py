"""Workflow orchestration service: decisions, revisions, re-checking, and approvals."""

from app.checks.context import CheckContext
from app.checks.runner import run_deterministic_checks
from app.constants import DecisionAction, FindingStatus, ReviewStatus, Role, Severity
from app.models.entities import ReviewModel
from app.repositories.audit_repo import AuditRepository
from app.repositories.brand_repo import BrandRepository
from app.repositories.review_repo import ReviewRepository
from app.schemas.schemas import PurposeCard
from sqlalchemy.orm import Session


class WorkflowService:
    """Manages human-in-the-loop review actions, version progression, and approval gates."""

    def __init__(self, db: Session, workspace_id: str | None = None):
        self.db = db
        self.workspace_id = workspace_id
        self.review_repo = ReviewRepository(db, workspace_id)
        self.brand_repo = BrandRepository(db, workspace_id)
        self.audit_repo = AuditRepository(db)

    def act_on_finding(
        self,
        finding_id: str,
        actor_role: Role,
        action: DecisionAction,
        reason: str | None = None,
        edited_suggestion: str | None = None,
    ) -> ReviewModel:
        """Apply a decision to a finding. Accepting or editing spawns a revised version and re-evaluates rules."""
        finding = self.review_repo.get_finding(finding_id)
        if not finding:
            raise ValueError(f"Finding '{finding_id}' not found")

        review = self.review_repo.get_review(finding.review_id)
        if not review:
            raise ValueError(f"Review '{finding.review_id}' not found")

        # Record human decision on the finding
        self.review_repo.record_decision(
            finding_id=finding.id,
            actor_role=actor_role,
            action=action,
            reason=reason,
        )

        # Audit event
        self.audit_repo.append_audit_event(
            actor_role=actor_role,
            action=f"finding_{action.value}",
            entity="finding",
            entity_id=finding.id,
            detail={"review_id": review.id, "reason": reason},
        )

        # If Accept or Edit: Spawn a new version and re-check
        if action in (DecisionAction.ACCEPT, DecisionAction.EDIT):
            replacement = (
                edited_suggestion
                if (action == DecisionAction.EDIT and edited_suggestion)
                else finding.suggestion
            )

            # Get current content text
            curr_ver_model = [v for v in review.versions if v.version == review.current_version]
            curr_text = curr_ver_model[0].content if curr_ver_model else ""

            if replacement and finding.excerpt in curr_text:
                new_text = curr_text.replace(finding.excerpt, replacement, 1)
            else:
                new_text = curr_text

            # Create new version
            new_version_model = self.review_repo.create_new_version(
                review_id=review.id,
                new_content=new_text,
                reason=reason or f"Applied {action.value} on finding {finding.id}",
            )

            # Re-run deterministic checks on new version
            kit = self.brand_repo.get_brand_kit(review.kit_id)
            if kit:
                rules_data = [
                    {
                        "id": r.id,
                        "category": r.category,
                        "title": r.title,
                        "text": r.text,
                        "banned_terms": r.banned_terms,
                        "severity": r.severity,
                        "version": r.version,
                        "status": r.status,
                        "effective_from": r.effective_from,
                        "owner": r.owner,
                        "source": r.source,
                    }
                    for r in kit.rules
                ]
                facts_data = [
                    {
                        "id": f.id,
                        "subject": f.subject,
                        "value": f.value,
                        "unit": f.unit,
                        "valid_from": f.valid_from,
                        "valid_to": f.valid_to,
                        "permitted_wording": f.permitted_wording,
                        "owner": f.owner,
                        "source": f.source,
                        "status": f.status,
                    }
                    for f in kit.facts
                ]
                purpose_card = PurposeCard.model_validate_json(review.purpose_card_json)
                ctx = CheckContext(
                    text=new_text,
                    rules=rules_data,
                    facts=facts_data,
                    purpose_card=purpose_card,
                    review_id=review.id,
                    version=new_version_model.version,
                    content_type=review.content_type,
                    ai_declared=review.ai_declared,
                    brand_kit_id=kit.id,
                    target_reading_level=kit.target_reading_level,
                )
                new_findings = run_deterministic_checks(ctx)
                self.review_repo.save_findings(new_findings)

            self.audit_repo.append_audit_event(
                actor_role=actor_role,
                action="version_created",
                entity="review_version",
                entity_id=new_version_model.id,
                detail={"version": new_version_model.version, "review_id": review.id},
            )

        elif action == DecisionAction.ASK_REVIEWER:
            review.status = ReviewStatus.IN_HUMAN_REVIEW.value
            self.db.commit()

        self.db.refresh(review)
        return review

    def record_approval_decision(
        self,
        review_id: str,
        actor_role: Role,
        outcome: str,
        reason: str | None = None,
    ) -> ReviewModel:
        """Enforce approval gates and finalize workflow status."""
        review = self.review_repo.get_review(review_id)
        if not review:
            raise ValueError(f"Review '{review_id}' not found")

        # Manager Gate Check: Blockers or Overridden Unsubstantiated claims require Brand Manager
        active_findings = self.review_repo.get_findings_for_version(
            review.id, review.current_version
        )
        has_blocker_or_override = any(
            f.severity == Severity.BLOCKER.value or f.status == FindingStatus.UNSUPPORTED.value
            for f in active_findings
        )

        if outcome == "Approved" and has_blocker_or_override and actor_role != Role.BRAND_MANAGER:
            raise PermissionError(
                "Content contains Blocker findings or unsupported claims. Approval is gated to the Brand Manager role."
            )

        self.review_repo.record_approval(
            review_id=review.id,
            role=actor_role,
            outcome=outcome,
            reason=reason,
        )

        self.audit_repo.append_audit_event(
            actor_role=actor_role,
            action=f"review_{outcome.lower().replace(' ', '_')}",
            entity="review",
            entity_id=review.id,
            detail={"outcome": outcome, "reason": reason, "version": review.current_version},
        )

        self.db.refresh(review)
        return review
