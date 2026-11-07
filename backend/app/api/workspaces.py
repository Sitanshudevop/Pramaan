"""Workspace tenant management, onboarding wizard, and team collaboration router."""

import json
import uuid
from datetime import UTC, datetime, timedelta

from app.auth.dependencies import (
    WorkspaceContext,
    get_current_user,
    get_workspace_context,
    require_role,
)
from app.auth.security import generate_secure_token, hash_token
from app.database import get_db
from app.models.entities import (
    AuditLogModel,
    BrandKitModel,
    InvitationModel,
    MembershipModel,
    RuleModel,
    UserModel,
    WorkspaceModel,
)
from app.schemas.schemas import (
    CreateInvitationRequest,
    InvitationResponse,
    OnboardingWizardRequest,
    WorkspaceCreateRequest,
    WorkspaceMemberResponse,
    WorkspaceResponse,
    WorkspaceSettingsUpdateRequest,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get("", response_model=list[WorkspaceResponse])
def list_my_workspaces(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all workspaces where current user holds an active membership."""
    memberships = db.query(MembershipModel).filter(MembershipModel.user_id == user.id).all()
    results: list[WorkspaceResponse] = []
    for m in memberships:
        w = db.query(WorkspaceModel).filter(WorkspaceModel.id == m.workspace_id).first()
        if w:
            results.append(
                WorkspaceResponse(
                    id=w.id,
                    name=w.name,
                    slug=w.slug,
                    industry=w.industry,
                    is_demo=w.is_demo,
                    retention_days=w.retention_days,
                    ai_enabled=w.ai_enabled,
                    role=m.role,
                )
            )
    return results


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    req: WorkspaceCreateRequest,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new company or team workspace with creator as Admin."""
    ws_id = f"ws-{uuid.uuid4().hex[:12]}"
    slug = f"{req.name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}"

    workspace = WorkspaceModel(
        id=ws_id,
        name=req.name.strip(),
        slug=slug,
        industry=req.industry.strip(),
        is_demo=False,
        retention_days=90,
        ai_enabled=False,
    )
    db.add(workspace)

    membership = MembershipModel(
        id=f"mem-{uuid.uuid4().hex[:12]}",
        workspace_id=ws_id,
        user_id=user.id,
        role="Admin",
    )
    db.add(membership)

    audit_evt = AuditLogModel(
        workspace_id=ws_id,
        actor_id=user.id,
        actor_role="Admin",
        action="WORKSPACE_CREATED",
        entity="workspace",
        entity_id=ws_id,
        detail_json=json.dumps({"name": req.name}),
    )
    db.add(audit_evt)
    db.commit()

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        industry=workspace.industry,
        is_demo=False,
        retention_days=workspace.retention_days,
        ai_enabled=workspace.ai_enabled,
        role="Admin",
    )


@router.post("/onboarding", response_model=WorkspaceResponse)
def complete_onboarding(
    req: OnboardingWizardRequest,
    user: UserModel = Depends(get_current_user),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """Complete 3-step onboarding: update workspace, create first brand kit, issue invites."""
    ws = ctx.workspace
    ws.name = req.workspace_name.strip()
    ws.industry = req.industry.strip()

    # Step 2: Create initial Brand Kit
    kit_id = f"kit-{uuid.uuid4().hex[:10]}"
    kit = BrandKitModel(
        id=kit_id,
        workspace_id=ws.id,
        name=req.brand_name.strip(),
        industry=req.industry.strip(),
        primary_language=req.primary_language,
        voice_tone=req.voice_tone,
        target_reading_level=req.target_reading_level,
        primary_color=req.brand_colors[0] if req.brand_colors else "#FF8A4C",
        brand_colors_json=json.dumps(req.brand_colors),
    )
    db.add(kit)

    # Step 3: Handle initial invites if provided
    for email in req.invite_emails:
        clean_email = email.strip().lower()
        if clean_email:
            raw_token = generate_secure_token(24)
            inv = InvitationModel(
                id=f"inv-{uuid.uuid4().hex[:10]}",
                workspace_id=ws.id,
                email=clean_email,
                token_hash=hash_token(raw_token),
                role="Reviewer",
                inviter_id=user.id,
                expires_at=datetime.now(UTC) + timedelta(days=7),
                max_uses=1,
            )
            db.add(inv)

    db.commit()
    db.refresh(ws)

    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        industry=ws.industry,
        is_demo=ws.is_demo,
        retention_days=ws.retention_days,
        ai_enabled=ws.ai_enabled,
        role=ctx.role,
    )


@router.get("/demo", response_model=WorkspaceResponse)
def get_or_reset_demo_workspace(db: Session = Depends(get_db)):
    """Fetch or initialize the isolated public Demo workspace."""
    demo_ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()
    if not demo_ws:
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

    return WorkspaceResponse(
        id=demo_ws.id,
        name=demo_ws.name,
        slug=demo_ws.slug,
        industry=demo_ws.industry,
        is_demo=True,
        retention_days=30,
        ai_enabled=True,
        role="Creator",
    )


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
def list_workspace_members(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """List members of current workspace with their assigned roles."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden.")

    memberships = db.query(MembershipModel).filter(MembershipModel.workspace_id == workspace_id).all()
    results: list[WorkspaceMemberResponse] = []
    for m in memberships:
        u = db.query(UserModel).filter(UserModel.id == m.user_id).first()
        if u:
            results.append(
                WorkspaceMemberResponse(
                    membership_id=m.id,
                    user_id=u.id,
                    email=u.email,
                    full_name=u.full_name,
                    role=m.role,
                    created_at=m.created_at,
                )
            )
    return results


@router.post("/{workspace_id}/invitations", response_model=InvitationResponse)
def create_invitation(
    workspace_id: str,
    req: CreateInvitationRequest,
    user: UserModel = Depends(get_current_user),
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
):
    """Generate a shareable or email-directed invite link (Admin/Manager only)."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden.")

    raw_token = generate_secure_token(24)
    inv_id = f"inv-{uuid.uuid4().hex[:10]}"
    expires = datetime.now(UTC) + timedelta(days=7)

    inv = InvitationModel(
        id=inv_id,
        workspace_id=workspace_id,
        email=req.email.strip().lower() if req.email else None,
        token_hash=hash_token(raw_token),
        role=req.role if req.role in ["Creator", "Reviewer", "Brand manager"] else "Reviewer",
        inviter_id=user.id,
        expires_at=expires,
        max_uses=req.max_uses,
    )
    db.add(inv)

    audit_evt = AuditLogModel(
        workspace_id=workspace_id,
        actor_id=user.id,
        actor_role=ctx.role,
        action="INVITATION_CREATED",
        entity="invitation",
        entity_id=inv_id,
        detail_json=json.dumps({"role": inv.role, "email": inv.email}),
    )
    db.add(audit_evt)
    db.commit()

    return InvitationResponse(
        id=inv.id,
        token=raw_token,
        invite_url=f"/join/{raw_token}",
        role=inv.role,
        email=inv.email,
        expires_at=inv.expires_at,
        used_count=0,
        max_uses=inv.max_uses,
    )


@router.post("/invitations/accept")
def accept_invitation(
    token: str,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept an invite token and join the workspace."""
    t_hash = hash_token(token)
    inv = (
        db.query(InvitationModel)
        .filter(
            InvitationModel.token_hash == t_hash,
            InvitationModel.revoked_at.is_(None),
        )
        .first()
    )

    now = datetime.now(UTC)
    if not inv or inv.expires_at < now or inv.used_count >= inv.max_uses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation link is invalid, expired, or has reached maximum usage.",
        )

    # Check if already a member
    existing = (
        db.query(MembershipModel)
        .filter(
            MembershipModel.workspace_id == inv.workspace_id,
            MembershipModel.user_id == user.id,
        )
        .first()
    )

    if not existing:
        mem = MembershipModel(
            id=f"mem-{uuid.uuid4().hex[:12]}",
            workspace_id=inv.workspace_id,
            user_id=user.id,
            role=inv.role,
        )
        db.add(mem)

    inv.used_count += 1
    db.commit()

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == inv.workspace_id).first()
    return {
        "message": f"Successfully joined {ws.name if ws else 'the workspace'}.",
        "workspace_id": inv.workspace_id,
        "role": inv.role,
    }


@router.put("/{workspace_id}/members/{target_user_id}/role")
def update_member_role(
    workspace_id: str,
    target_user_id: str,
    new_role: str,
    user: UserModel = Depends(get_current_user),
    ctx: WorkspaceContext = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    """Update a team member's role (Admin only)."""
    if ctx.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden.")

    if new_role not in ["Admin", "Brand manager", "Reviewer", "Creator"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified.")

    mem = (
        db.query(MembershipModel)
        .filter(
            MembershipModel.workspace_id == workspace_id,
            MembershipModel.user_id == target_user_id,
        )
        .first()
    )

    if not mem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")

    old_role = mem.role
    mem.role = new_role

    audit_evt = AuditLogModel(
        workspace_id=workspace_id,
        actor_id=user.id,
        actor_role="Admin",
        action="ROLE_UPDATED",
        entity="membership",
        entity_id=mem.id,
        detail_json=json.dumps({"target_user_id": target_user_id, "old_role": old_role, "new_role": new_role}),
    )
    db.add(audit_evt)
    db.commit()

    return {"message": "Role updated successfully.", "role": new_role}


@router.delete("/{workspace_id}/members/{target_user_id}")
def remove_workspace_member(
    workspace_id: str,
    target_user_id: str,
    user: UserModel = Depends(get_current_user),
    ctx: WorkspaceContext = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    """Remove a member from the workspace (Admin only). Workspace must keep at least 1 Admin."""
    if ctx.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden.")

    # Prevent removing last admin
    admins = (
        db.query(MembershipModel)
        .filter(
            MembershipModel.workspace_id == workspace_id,
            MembershipModel.role == "Admin",
        )
        .all()
    )
    if len(admins) <= 1 and any(a.user_id == target_user_id for a in admins):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the only Admin. Transfer Admin role to another member first.",
        )

    mem = (
        db.query(MembershipModel)
        .filter(
            MembershipModel.workspace_id == workspace_id,
            MembershipModel.user_id == target_user_id,
        )
        .first()
    )
    if mem:
        db.delete(mem)
        audit_evt = AuditLogModel(
            workspace_id=workspace_id,
            actor_id=user.id,
            actor_role="Admin",
            action="MEMBER_REMOVED",
            entity="membership",
            entity_id=mem.id,
            detail_json=json.dumps({"target_user_id": target_user_id}),
        )
        db.add(audit_evt)
        db.commit()

    return {"message": "Member removed successfully."}


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace_settings(
    workspace_id: str,
    req: WorkspaceSettingsUpdateRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    """Update workspace settings (Admin only)."""
    if ctx.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden.")

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    if req.name is not None:
        ws.name = req.name
    if req.industry is not None:
        ws.industry = req.industry
    if req.retention_days is not None:
        ws.retention_days = req.retention_days
    if req.ai_enabled is not None:
        ws.ai_enabled = req.ai_enabled

    db.commit()
    db.refresh(ws)
    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        industry=ws.industry,
        is_demo=ws.is_demo,
        retention_days=ws.retention_days,
        ai_enabled=ws.ai_enabled,
        role=ctx.role.value if hasattr(ctx.role, "value") else str(ctx.role),
    )


@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    """Delete a workspace and cascade-remove its tenant assets (Admin only, non-demo)."""
    if ctx.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden.")

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    if ws.is_demo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Demo workspace cannot be deleted.")

    db.delete(ws)
    db.commit()
    return {"message": f"Workspace '{ws.name}' deleted successfully."}
