"""Review lifecycle, findings resolution, and approval routes."""

import json

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
from app.models.entities import FindingModel, ReviewModel
from app.repositories.review_repo import ReviewRepository
from app.schemas.schemas import (
    ActOnFindingRequest,
    AddCommentRequest,
    Approval,
    ApprovalDecisionRequest,
    Comment,
    CreateReviewRequest,
    DecisionRecord,
    Finding,
    OverrideFindingRequest,
    PurposeCard,
    ReviewResponse,
    ReviewVersionSummary,
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
        pass_notice=PASS_EXPLANATION_SENTENCE,
    )


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_review(
    request: Request,
    payload: CreateReviewRequest,
    role: Role = Depends(require_permission(Permission.SUBMIT_CONTENT)),
    x_confidential_mode: str = Header(default="0", alias="X-Confidential-Mode"),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Submit content for evidence-grounded review evaluation."""
    service = ReviewService(db)
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
    db: Session = Depends(get_db),
) -> list[ReviewResponse]:
    """List reviews sorted by update recency."""
    repo = ReviewRepository(db)
    reviews = repo.list_reviews(role=role, kit_id=kit_id)
    return [_format_review(r) for r in reviews]


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: str,
    version: int | None = None,
    role: Role = Depends(get_current_role),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Fetch review details, findings, diffs, and comments."""
    repo = ReviewRepository(db)
    review = repo.get_review(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Review '{review_id}' not found"}},
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
