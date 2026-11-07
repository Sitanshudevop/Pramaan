"""Repository for Review lifecycle, versioning, findings, and decisions."""

import difflib
import json
import uuid
from datetime import datetime

from app.constants import DecisionAction, ReviewStatus, Role
from app.models.base import get_utc_now
from app.models.entities import (
    ApprovalModel,
    CommentModel,
    DecisionModel,
    FindingModel,
    ReviewModel,
    ReviewVersionModel,
)
from app.schemas.schemas import Finding, PurposeCard
from sqlalchemy.orm import Session


class ReviewRepository:
    """Manages database interactions for reviews, versions, findings, comments and decisions."""

    def __init__(self, db: Session, workspace_id: str | None = None):
        self.db = db
        self.workspace_id = workspace_id

    def create_review(
        self,
        kit_id: str,
        content: str,
        content_type: str,
        purpose_card: PurposeCard,
        ai_declared: bool,
        created_by_role: Role,
        workspace_id: str | None = None,
        author_id: str | None = None,
        assignee_id: str | None = None,
        created_at: datetime | None = None,
    ) -> ReviewModel:
        """Create a new review submission and its initial version snapshot."""
        review_id = f"rev-{uuid.uuid4().hex[:12]}"
        review = ReviewModel(
            id=review_id,
            workspace_id=workspace_id or self.workspace_id,
            creator_id=author_id,
            assignee_id=assignee_id,
            kit_id=kit_id,
            status=ReviewStatus.SUBMITTED.value,
            content_type=content_type,
            purpose_card_json=purpose_card.model_dump_json(),
            ai_declared=ai_declared,
            current_version=1,
            created_by_role=created_by_role.value
            if hasattr(created_by_role, "value")
            else str(created_by_role),
            created_at=created_at or get_utc_now(),
            updated_at=created_at or get_utc_now(),
        )
        self.db.add(review)

        # Initial Version Snapshot
        version = ReviewVersionModel(
            id=f"ver-{review_id}-1",
            review_id=review_id,
            version=1,
            content=content,
            diff_from_previous=None,
            created_at=created_at or get_utc_now(),
        )
        self.db.add(version)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_review(self, review_id: str) -> ReviewModel | None:
        """Fetch review with relationships scoped by tenant."""
        query = self.db.query(ReviewModel).filter(ReviewModel.id == review_id)
        if self.workspace_id:
            query = query.filter(ReviewModel.workspace_id == self.workspace_id)
        return query.first()

    def list_reviews(self, role: Role, kit_id: str | None = None) -> list[ReviewModel]:
        """List reviews scoped by workspace and optional kit filter."""
        query = self.db.query(ReviewModel)
        if self.workspace_id:
            query = query.filter(ReviewModel.workspace_id == self.workspace_id)
        if kit_id:
            query = query.filter(ReviewModel.kit_id == kit_id)

        return query.order_by(ReviewModel.updated_at.desc()).all()

    def save_findings(self, findings: list[Finding]) -> None:
        """Batch persist findings for a review version."""
        for f in findings:
            model = FindingModel(
                id=f.id,
                review_id=f.review_id,
                version=f.version,
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
                suggestion_check_json=f.suggestion_check.model_dump_json(),
                decision_json=f.decision.model_dump_json() if f.decision else None,
            )
            self.db.add(model)
        self.db.commit()

    def get_findings_for_version(self, review_id: str, version: int) -> list[FindingModel]:
        """Retrieve findings for a specific version."""
        return (
            self.db.query(FindingModel)
            .filter(FindingModel.review_id == review_id, FindingModel.version == version)
            .all()
        )

    def get_finding(self, finding_id: str) -> FindingModel | None:
        """Get an individual finding."""
        return self.db.query(FindingModel).filter(FindingModel.id == finding_id).first()

    def record_decision(
        self,
        finding_id: str,
        actor_role: Role,
        action: DecisionAction,
        reason: str | None = None,
    ) -> DecisionModel:
        """Record a human decision on a finding."""
        decision_id = f"dec-{uuid.uuid4().hex[:12]}"
        decision = DecisionModel(
            id=decision_id,
            finding_id=finding_id,
            actor_role=actor_role.value if hasattr(actor_role, "value") else str(actor_role),
            action=action.value,
            reason=reason,
        )
        self.db.add(decision)

        now_iso = get_utc_now().isoformat()
        # Update finding record
        finding = self.get_finding(finding_id)
        if finding:
            finding.decision_json = json.dumps(
                {
                    "id": decision_id,
                    "finding_id": finding_id,
                    "actor_role": actor_role.value
                    if hasattr(actor_role, "value")
                    else str(actor_role),
                    "action": action.value,
                    "reason": reason,
                    "created_at": decision.created_at.isoformat()
                    if decision.created_at
                    else now_iso,
                }
            )

        self.db.commit()
        self.db.refresh(decision)
        return decision

    def create_new_version(
        self,
        review_id: str,
        new_content: str,
        reason: str | None = None,
    ) -> ReviewVersionModel:
        """Create a new version snapshot and calculate readable diff."""
        review = self.get_review(review_id)
        if not review:
            raise ValueError(f"Review {review_id} not found")

        prev_version = review.current_version
        prev_model = (
            self.db.query(ReviewVersionModel)
            .filter(
                ReviewVersionModel.review_id == review_id,
                ReviewVersionModel.version == prev_version,
            )
            .first()
        )
        prev_text = prev_model.content if prev_model else ""

        # Compute line diff
        diff_lines = list(
            difflib.unified_diff(
                prev_text.splitlines(keepends=True),
                new_content.splitlines(keepends=True),
                fromfile=f"v{prev_version}",
                tofile=f"v{prev_version + 1}",
                n=2,
            )
        )
        diff_str = "".join(diff_lines)

        next_version = prev_version + 1
        review.current_version = next_version
        review.status = ReviewStatus.REVISED.value

        ver_model = ReviewVersionModel(
            id=f"ver-{review_id}-{next_version}",
            review_id=review_id,
            version=next_version,
            content=new_content,
            diff_from_previous=diff_str,
        )
        self.db.add(ver_model)
        self.db.commit()
        self.db.refresh(ver_model)
        return ver_model

    def add_comment(self, review_id: str, actor_role: Role, message: str) -> CommentModel:
        """Post a comment to a review thread."""
        comment_id = f"comm-{uuid.uuid4().hex[:12]}"
        comment = CommentModel(
            id=comment_id,
            review_id=review_id,
            actor_role=actor_role.value if hasattr(actor_role, "value") else str(actor_role),
            message=message,
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def record_approval(
        self,
        review_id: str,
        role: Role,
        outcome: str,
        reason: str | None = None,
    ) -> ApprovalModel:
        """Record workflow state approval or rejection."""
        app_id = f"appr-{uuid.uuid4().hex[:12]}"
        approval = ApprovalModel(
            id=app_id,
            review_id=review_id,
            role=role.value if hasattr(role, "value") else str(role),
            outcome=outcome,
            reason=reason,
        )
        self.db.add(approval)

        review = self.get_review(review_id)
        if review:
            if outcome == "Approved":
                review.status = ReviewStatus.APPROVED.value
            elif outcome == "Rejected":
                review.status = ReviewStatus.REJECTED.value
            elif outcome == "Changes requested":
                review.status = ReviewStatus.CHANGES_REQUESTED.value

        self.db.commit()
        self.db.refresh(approval)
        return approval
