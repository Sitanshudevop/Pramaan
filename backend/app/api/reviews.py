"""Review lifecycle, findings resolution, and approval routes."""

import json
import uuid

from app.auth.dependencies import WorkspaceContext, get_current_user_optional, get_workspace_context
from app.checks.context import CheckContext
from app.checks.runner import run_deterministic_checks
from app.constants import (
    PASS_EXPLANATION_SENTENCE,
    CheckMethod,
    DecisionAction,
    FindingStatus,
    ReviewStatus,
    Role,
    Severity,
)
from app.deps import get_db, limiter
from app.models.entities import FindingModel, NotificationModel, ReviewModel, UserModel
from app.repositories.audit_repo import AuditRepository
from app.repositories.brand_repo import BrandRepository
from app.repositories.review_repo import ReviewRepository
from app.schemas.schemas import (
    ActOnFindingRequest,
    AddCommentRequest,
    Approval,
    ApprovalDecisionRequest,
    AssignReviewRequest,
    Comment,
    CreateReviewRequest,
    DecisionRecord,
    Finding,
    OverrideFindingRequest,
    PurposeCard,
    ReviewResponse,
    ReviewVersionSummary,
    ReviseReviewRequest,
    SuggestionCheck,
)
from app.security import (
    Permission,
    get_current_role,
    require_permission,
)
from app.services.certificate_service import generate_approval_certificate_html
from app.services.review_service import ReviewService
from app.services.workflow_service import WorkflowService
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def _format_finding(f: FindingModel) -> Finding:
    decision_data = None
    if f.decision_json:
        try:
            d_dict = json.loads(f.decision_json)
            decision_data = DecisionRecord(
                id=d_dict["id"],
                finding_id=d_dict["finding_id"],
                actor_role=Role(d_dict["actor_role"]),
                action=DecisionAction(d_dict["action"]),
                reason=d_dict.get("reason"),
                created_at=f.created_at,
            )
        except Exception:
            decision_data = None

    check_data = SuggestionCheck()
    if f.suggestion_check_json:
        try:
            check_data = SuggestionCheck.model_validate_json(f.suggestion_check_json)
        except Exception:
            check_data = SuggestionCheck()

    return Finding(
        id=f.id,
        review_id=f.review_id,
        version=f.version,
        category=f.category,
        severity=Severity(f.severity),
        status=FindingStatus(f.status),
        method=CheckMethod(f.method),
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
        suggestion_check=check_data,
        decision=decision_data,
        created_at=f.created_at,
    )


def _format_review(review: ReviewModel, active_version: int | None = None) -> ReviewResponse:
    target_ver = active_version or review.current_version
    version_findings = [f for f in review.findings if f.version == target_ver]

    return ReviewResponse(
        id=review.id,
        kit_id=review.kit_id,
        status=ReviewStatus(review.status),
        content_type=review.content_type,
        purpose_card=PurposeCard.model_validate_json(review.purpose_card_json),
        ai_declared=review.ai_declared,
        current_version=review.current_version,
        created_by_role=Role(review.created_by_role),
        creator_id=review.creator_id,
        assignee_id=review.assignee_id,
        created_at=review.created_at,
        updated_at=review.updated_at,
        versions=[
            ReviewVersionSummary(
                id=v.id,
                version=v.version,
                content=v.content,
                diff_from_previous=v.diff_from_previous,
                created_at=v.created_at,
            )
            for v in review.versions
        ],
        findings=[_format_finding(f) for f in version_findings],
        comments=[
            Comment(
                id=c.id,
                review_id=c.review_id,
                actor_role=Role(c.actor_role),
                message=c.message,
                created_at=c.created_at,
            )
            for c in review.comments
        ],
        approvals=[
            Approval(
                id=a.id,
                review_id=a.review_id,
                role=Role(a.role),
                outcome=a.outcome,
                reason=a.reason,
                created_at=a.created_at,
            )
            for a in review.approvals
        ],
        is_overdue=review.is_overdue,
        pass_notice=PASS_EXPLANATION_SENTENCE,
    )


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_review(
    request: Request,
    payload: CreateReviewRequest,
    role: Role = Depends(require_permission(Permission.SUBMIT_CONTENT)),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    x_confidential_mode: str = Header(default="0", alias="X-Confidential-Mode"),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Submit content for evidence-grounded review evaluation."""
    service = ReviewService(db, workspace_id=ctx.workspace_id)
    is_confidential = x_confidential_mode == "1"
    try:
        review = await service.execute_review(
            request=payload,
            actor_role=role,
            confidential_mode=is_confidential,
        )
        return _format_review(review)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_INPUT", "message": str(e)}},
        )


@router.get("", response_model=list[ReviewResponse])
def list_reviews(
    kit_id: str | None = None,
    role: Role = Depends(get_current_role),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
) -> list[ReviewResponse]:
    """List reviews sorted by update recency scoped by active workspace."""
    repo = ReviewRepository(db, workspace_id=ctx.workspace_id)
    reviews = repo.list_reviews(role=role, kit_id=kit_id)
    return [_format_review(r) for r in reviews]


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: str,
    version: int | None = None,
    role: Role = Depends(get_current_role),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Fetch review details, findings, diffs, and comments."""
    repo = ReviewRepository(db, workspace_id=ctx.workspace_id)
    review = repo.get_review(review_id)
    if not review:
        # Fallback to unscoped check if not found
        review = ReviewRepository(db).get_review(review_id)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {"code": "NOT_FOUND", "message": f"Review '{review_id}' not found"}
                },
            )
    return _format_review(review, active_version=version)


@router.post("/{review_id}/findings/{finding_id}/act", response_model=ReviewResponse)
def act_on_finding(
    review_id: str,
    finding_id: str,
    payload: ActOnFindingRequest,
    role: Role = Depends(require_permission(Permission.ACT_ON_FINDINGS)),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Creator acts on a finding: Accept, Edit, Dismiss (reason required), or Ask Reviewer."""
    if payload.action == DecisionAction.DISMISS and not payload.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "REASON_REQUIRED",
                    "message": "A reason is mandatory when dismissing a finding.",
                }
            },
        )

    service = WorkflowService(db)
    try:
        review = service.act_on_finding(
            finding_id=finding_id,
            actor_role=role,
            action=payload.action,
            reason=payload.reason,
            edited_suggestion=payload.edited_suggestion,
        )
        return _format_review(review)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_ACTION", "message": str(e)}},
        )


@router.post("/{review_id}/findings/{finding_id}/override", response_model=ReviewResponse)
def override_finding(
    review_id: str,
    finding_id: str,
    payload: OverrideFindingRequest,
    role: Role = Depends(require_permission(Permission.OVERRIDE_FINDING)),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Reviewer or Brand Manager overrides a finding with a mandatory reason."""
    service = WorkflowService(db)
    try:
        review = service.act_on_finding(
            finding_id=finding_id,
            actor_role=role,
            action=DecisionAction.OVERRIDE,
            reason=payload.reason,
        )
        return _format_review(review)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_ACTION", "message": str(e)}},
        )


@router.post("/{review_id}/comments", response_model=Comment)
def add_comment(
    review_id: str,
    payload: AddCommentRequest,
    role: Role = Depends(require_permission(Permission.COMMENT_REQUEST_CHANGES)),
    db: Session = Depends(get_db),
) -> Comment:
    """Add a collaboration comment to the review thread."""
    repo = ReviewRepository(db)
    review = repo.get_review(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Review '{review_id}' not found"}},
        )
    comm = repo.add_comment(review_id=review_id, actor_role=role, message=payload.message)
    return Comment(
        id=comm.id,
        review_id=comm.review_id,
        actor_role=Role(comm.actor_role),
        message=comm.message,
        created_at=comm.created_at,
    )


@router.post("/{review_id}/approval", response_model=ReviewResponse)
def record_approval(
    review_id: str,
    payload: ApprovalDecisionRequest,
    role: Role = Depends(require_permission(Permission.APPROVE_REJECT)),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Enforce human approval gates: Reviewer approvals or Brand Manager gated approvals."""
    service = WorkflowService(db)
    try:
        review = service.record_approval_decision(
            review_id=review_id,
            actor_role=role,
            outcome=payload.outcome,
            reason=payload.reason,
        )
        # Notify review author if known
        if review.creator_id:
            notif = NotificationModel(
                id=f"notif-{uuid.uuid4().hex[:12]}",
                workspace_id=review.workspace_id,
                user_id=review.creator_id,
                type="status_change",
                title=f"Review {payload.outcome}",
                body=f"Review {review.id} was marked as {payload.outcome} by {role.value if hasattr(role, 'value') else role}.",
                link=f"/app/review/{review.id}",
                is_read=False,
            )
            db.add(notif)
            db.commit()
        return _format_review(review)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "GATED_APPROVAL", "message": str(e)}},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_APPROVAL", "message": str(e)}},
        )


@router.post("/{review_id}/assign", response_model=ReviewResponse)
def assign_review(
    review_id: str,
    payload: AssignReviewRequest,
    role: Role = Depends(require_permission(Permission.ACT_ON_FINDINGS)),
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Assign or claim a review for inspection."""
    repo = ReviewRepository(db, workspace_id=ctx.workspace_id)
    review = repo.get_review(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Review '{review_id}' not found"}},
        )

    target_assignee = payload.assignee_id or (user.id if user else None)
    review.assignee_id = target_assignee

    if target_assignee and user and target_assignee != user.id:
        notif = NotificationModel(
            id=f"notif-{uuid.uuid4().hex[:12]}",
            workspace_id=ctx.workspace_id,
            user_id=target_assignee,
            type="assignment",
            title="Review Assigned",
            body=f"{user.full_name} assigned review {review.id} to you.",
            link=f"/app/review/{review.id}",
            is_read=False,
        )
        db.add(notif)

    db.commit()
    db.refresh(review)
    return _format_review(review)


@router.post("/{review_id}/versions", response_model=ReviewResponse)
def create_draft_version(
    review_id: str,
    payload: ReviseReviewRequest,
    role: Role = Depends(require_permission(Permission.ACT_ON_FINDINGS)),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Creator or Reviewer submits a revised draft text directly, spawning a new version and re-evaluating rules."""
    review_repo = ReviewRepository(db)
    brand_repo = BrandRepository(db)
    audit_repo = AuditRepository(db)

    review = review_repo.get_review(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Review '{review_id}' not found"}},
        )

    new_version_model = review_repo.create_new_version(
        review_id=review.id,
        new_content=payload.content,
        reason=payload.reason or f"Direct revision by {role.value}",
    )

    kit = brand_repo.get_brand_kit(review.kit_id)
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
            text=payload.content,
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
        review_repo.save_findings(new_findings)

    audit_repo.append_audit_event(
        actor_role=role,
        action="version_created",
        entity="review_version",
        entity_id=new_version_model.id,
        detail={
            "version": new_version_model.version,
            "review_id": review.id,
            "reason": payload.reason,
        },
    )

    db.refresh(review)
    return _format_review(review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: str,
    role: Role = Depends(require_permission(Permission.APPROVE_REJECT)),
    db: Session = Depends(get_db),
) -> None:
    """Delete a review from the queue."""
    review_repo = ReviewRepository(db)
    review = review_repo.get_review(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Review '{review_id}' not found"}},
        )
    db.delete(review)
    db.commit()


@router.get("/{review_id}/certificate", response_class=HTMLResponse)
def get_approval_certificate(
    review_id: str,
    db: Session = Depends(get_db),
) -> HTMLResponse:
    """Generate a printable HTML approval certificate carrying the legal disclaimer."""
    repo = ReviewRepository(db)
    review = repo.get_review(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Review '{review_id}' not found"}},
        )

    # Find latest approval
    approver = "Brand Manager"
    reason = ""
    if review.approvals:
        latest = review.approvals[-1]
        approver = latest.role
        reason = latest.reason or ""

    html = generate_approval_certificate_html(review, approver, reason)
    return HTMLResponse(content=html)
