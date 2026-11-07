"""Brand insights and rule ambiguity analysis endpoints."""

from app.auth.dependencies import WorkspaceContext, get_workspace_context
from app.constants import Role
from app.deps import get_db
from app.repositories.insights_repo import InsightsRepository
from app.schemas.schemas import InsightsResponse
from app.security import Permission, require_permission
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=InsightsResponse)
def get_insights(
    brand_kit_id: str | None = None,
    role: Role = Depends(require_permission(Permission.VIEW_INSIGHTS)),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
) -> InsightsResponse:
    """Retrieve aggregate rule violation frequency, override trends, and ambiguity scores."""
    repo = InsightsRepository(db, workspace_id=ctx.workspace_id)
    return repo.get_insights(brand_kit_id=brand_kit_id)
