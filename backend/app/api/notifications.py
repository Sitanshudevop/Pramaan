"""In-app notifications router for review assignments, mentions, and workflow events."""

from datetime import UTC, datetime

from app.auth.dependencies import WorkspaceContext, get_current_user_optional, get_workspace_context
from app.database import get_db
from app.models.entities import NotificationModel, UserModel
from app.schemas.schemas import NotificationResponse
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """List in-app notifications for the active user in the current workspace."""
    if not user:
        # For demo / anonymous visitors, provide simulated or empty notifications
        if ctx.workspace_id == "ws-demo":
            return [
                NotificationResponse(
                    id="notif-demo-1",
                    workspace_id="ws-demo",
                    type="assignment",
                    title="Welcome to Pramaan Demo",
                    body="You are exploring the Demo Workspace. Try creating a review or testing rules.",
                    link="/app/new",
                    is_read=False,
                    created_at=datetime.now(UTC),
                )
            ]
        return []

    notifs = (
        db.query(NotificationModel)
        .filter(
            NotificationModel.workspace_id == ctx.workspace_id,
            NotificationModel.user_id == user.id,
        )
        .order_by(NotificationModel.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        NotificationResponse(
            id=n.id,
            workspace_id=n.workspace_id,
            type=n.type,
            title=n.title,
            body=n.body,
            link=n.link,
            is_read=n.is_read,
            created_at=n.created_at,
        )
        for n in notifs
    ]


@router.post("/{notification_id}/read", response_model=dict)
def mark_notification_read(
    notification_id: str,
    user: UserModel | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    if not user or notification_id.startswith("notif-demo"):
        return {"status": "ok", "id": notification_id}

    n = (
        db.query(NotificationModel)
        .filter(NotificationModel.id == notification_id, NotificationModel.user_id == user.id)
        .first()
    )
    if n:
        n.is_read = True
        db.commit()
    return {"status": "ok", "id": notification_id}


@router.post("/read-all", response_model=dict)
def mark_all_read(
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read for current user in workspace."""
    if user:
        db.query(NotificationModel).filter(
            NotificationModel.workspace_id == ctx.workspace_id,
            NotificationModel.user_id == user.id,
        ).update({"is_read": True})
        db.commit()
    return {"status": "ok"}
