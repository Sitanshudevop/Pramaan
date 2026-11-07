"""Authentication and workspace multi-tenant dependencies."""

from typing import Annotated

from app.auth.security import decode_access_token
from app.constants import Role
from app.database import get_db
from app.models.entities import MembershipModel, UserModel, WorkspaceModel
from app.security import ROLE_PERMISSIONS, Permission
from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session


def get_current_user_optional(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
    access_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> UserModel | None:
    """Optionally resolve authenticated user from Bearer header or cookie."""
    token: str | None = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif access_token:
        token = access_token

    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        return None

    user = (
        db.query(UserModel)
        .filter(UserModel.id == payload["sub"], UserModel.is_active.is_(True))
        .first()
    )
    return user


def get_current_user(
    user: UserModel | None = Depends(get_current_user_optional),
) -> UserModel:
    """Enforce authenticated user requirement."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


class WorkspaceContext:
    """Encapsulates active tenant workspace and user membership."""

    def __init__(
        self,
        workspace: WorkspaceModel,
        membership: MembershipModel | None,
        is_demo: bool = False,
        effective_role: str = "Creator",
    ):
        self.workspace = workspace
        self.membership = membership
        self.is_demo = is_demo
        self.role = effective_role
        self.workspace_id = workspace.id

    def has_permission(self, permission: Permission) -> bool:
        """Evaluate role permission matrix."""
        role_enum = Role(self.role)
        return permission in ROLE_PERMISSIONS.get(role_enum, set())


def get_workspace_context(
    request: Request,
    user: UserModel | None = Depends(get_current_user_optional),
    x_workspace_id: Annotated[str | None, Header()] = None,
    x_demo_role: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> WorkspaceContext:
    """Resolve workspace boundary and role permissions with strict tenant isolation."""
    # 1. Target workspace ID determination
    target_ws_id = x_workspace_id or "ws-demo"

    # 2. Check if target is the Demo workspace
    demo_ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()
    if not demo_ws:
        # Auto-create demo workspace container if not present
        demo_ws = WorkspaceModel(
            id="ws-demo",
            name="Demo Workspace",
            slug="demo-workspace",
            industry="Fictional Brands Demo",
            is_demo=True,
            ai_enabled=True,
        )
        db.add(demo_ws)
        db.commit()
        db.refresh(demo_ws)

    if target_ws_id == "ws-demo":
        # In Demo workspace, visitor or user can play any role via X-Demo-Role
        demo_role = x_demo_role or "Creator"
        if demo_role not in ["Creator", "Reviewer", "Brand manager", "Admin"]:
            demo_role = "Creator"
        return WorkspaceContext(
            workspace=demo_ws,
            membership=None,
            is_demo=True,
            effective_role=demo_role,
        )

    # 3. Real tenant workspace: requires authentication & membership
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access workspace.",
        )

    # Scoped query: user must have a membership in target_ws_id
    membership = (
        db.query(MembershipModel)
        .filter(
            MembershipModel.workspace_id == target_ws_id,
            MembershipModel.user_id == user.id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this workspace.",
        )

    workspace = db.query(WorkspaceModel).filter(WorkspaceModel.id == target_ws_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    return WorkspaceContext(
        workspace=workspace,
        membership=membership,
        is_demo=False,
        effective_role=membership.role,
    )


def require_role(*allowed_roles: str):
    """Enforce membership role authorization."""

    def _role_checker(ctx: WorkspaceContext = Depends(get_workspace_context)) -> WorkspaceContext:
        if ctx.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action restricted to {', '.join(allowed_roles)}. Your active role in this workspace is {ctx.role}.",
            )
        return ctx

    return _role_checker


def require_permission(perm: Permission):
    """Enforce specific permission from active workspace role."""

    def _perm_checker(ctx: WorkspaceContext = Depends(get_workspace_context)) -> WorkspaceContext:
        if not ctx.has_permission(perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {perm.value} requires an authorized workspace role (current role: {ctx.role}).",
            )
        return ctx

    return _perm_checker
