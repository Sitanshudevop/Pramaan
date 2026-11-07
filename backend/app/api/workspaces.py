"""Workspace tenant management, onboarding wizard, and team collaboration router."""

import json
import uuid
from datetime import UTC, datetime, timedelta

from app.auth.dependencies import (
    WorkspaceContext,
    get_current_user,
    get_current_user_optional,
    get_workspace_context,
    require_role,
)
from app.auth.security import generate_secure_token, hash_token
from app.constants import Role
from app.database import get_db
from app.models.entities import (
    AuditLogModel,
    BrandKitModel,
    ContentTypeModel,
    FactModel,
    InvitationModel,
    MembershipModel,
    ReviewModel,
    RuleModel,
    UserModel,
    WorkspaceModel,
)
from app.schemas.schemas import (
    ContentTypeResponse,
    CreateContentTypeRequest,
    CreateInvitationRequest,
    InvitationResponse,
    OnboardingWizardRequest,
    RetentionRunResponse,
    UpdateContentTypeRequest,
    WorkspaceCreateRequest,
    WorkspaceMemberResponse,
    WorkspaceResponse,
    WorkspaceSettingsResponse,
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
        from app.seed.loader import seed_database

        seed_database(db)
        demo_ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()

    return WorkspaceResponse(
        id=demo_ws.id if demo_ws else "ws-demo",
        name=demo_ws.name if demo_ws else "Demo Workspace",
        slug=demo_ws.slug if demo_ws else "demo-workspace",
        industry=demo_ws.industry if demo_ws else "Fictional Brands Demo",
        is_demo=True,
        retention_days=demo_ws.retention_days if demo_ws else 90,
        ai_enabled=demo_ws.ai_enabled if demo_ws else True,
        role="Creator",
    )


@router.post("/demo/reset")
def reset_demo_workspace_endpoint(
    role: Role = Depends(require_role(Role.ADMIN)),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """Admin-only reset of the Demo Workspace back to clean 8-week seed state."""
    if not ctx.is_demo and ctx.workspace_id != "ws-demo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset is only permitted on the Demo Workspace.",
        )
    from app.seed.loader import reset_database_seed

    reset_database_seed(db)
    return {
        "status": "reset_successful",
        "message": "Demo workspace successfully reset to authentic 8-week seed state.",
        "workspace_id": "ws-demo",
    }


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
def list_workspace_members(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """List members of current workspace with their assigned roles."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    memberships = (
        db.query(MembershipModel).filter(MembershipModel.workspace_id == workspace_id).all()
    )
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    if new_role not in ["Admin", "Brand manager", "Reviewer", "Creator"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified."
        )

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
        detail_json=json.dumps(
            {"target_user_id": target_user_id, "old_role": old_role, "new_role": new_role}
        ),
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

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


@router.get("/{workspace_id}/settings", response_model=WorkspaceSettingsResponse)
def get_workspace_settings(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """Retrieve comprehensive workspace governance and operational settings."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    # Find who enabled AI consent if recorded
    consent_by_name = None
    if ws.ai_consent_by_id:
        c_user = db.query(UserModel).filter(UserModel.id == ws.ai_consent_by_id).first()
        if c_user:
            consent_by_name = c_user.full_name

    # Query latest audit log entry for settings change
    last_audit = (
        db.query(AuditLogModel)
        .filter(
            AuditLogModel.workspace_id == workspace_id,
            AuditLogModel.action.in_(["WORKSPACE_SETTINGS_UPDATED", "WORKSPACE_CREATED"]),
        )
        .order_by(AuditLogModel.created_at.desc())
        .first()
    )
    last_changed_by = None
    last_changed_at = None
    if last_audit:
        last_changed_at = last_audit.created_at
        if last_audit.actor_id:
            a_user = db.query(UserModel).filter(UserModel.id == last_audit.actor_id).first()
            last_changed_by = a_user.full_name if a_user else last_audit.actor_role
        else:
            last_changed_by = last_audit.actor_role

    return WorkspaceSettingsResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        industry=ws.industry,
        is_demo=ws.is_demo,
        retention_days=ws.retention_days,
        ai_enabled=ws.ai_enabled,
        ai_consent_at=ws.ai_consent_at,
        ai_consent_by_id=ws.ai_consent_by_id,
        ai_consent_by_name=consent_by_name,
        ai_consent_version=ws.ai_consent_version,
        timezone=ws.timezone or "Asia/Kolkata",
        date_format=ws.date_format or "YYYY-MM-DD",
        default_brand_kit_id=ws.default_brand_kit_id or "kettle-and-co",
        default_spelling=ws.default_spelling or "en-IN",
        manager_approval_severity=ws.manager_approval_severity or "Blocker",
        require_decision_reason=ws.require_decision_reason
        if ws.require_decision_reason is not None
        else True,
        auto_assign_mode=ws.auto_assign_mode or "off",
        sla_hours=ws.sla_hours or 48,
        confidential_mode=ws.confidential_mode or False,
        redaction_options_json=ws.redaction_options_json
        or '{"emails": true, "phones": true, "cards": true}',
        logo_url=ws.logo_url,
        last_changed_by=last_changed_by,
        last_changed_at=last_changed_at,
        role=ctx.role,
    )


def _apply_settings_update(
    ws: WorkspaceModel,
    req: WorkspaceSettingsUpdateRequest,
    ctx: WorkspaceContext,
    user: UserModel | None,
    db: Session,
) -> dict[str, object]:
    """Helper to validate role permissions, apply workspace updates, and record audit."""
    if ctx.role in ["Creator", "Reviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{ctx.role}s cannot modify workspace settings or review policy.",
        )

    is_admin = ctx.role == "Admin"
    changed: dict[str, object] = {}

    if is_admin:
        if req.name is not None and req.name.strip() != ws.name:
            ws.name = req.name.strip()
            changed["name"] = ws.name
        if req.industry is not None and req.industry.strip() != ws.industry:
            ws.industry = req.industry.strip()
            changed["industry"] = ws.industry
        if req.retention_days is not None and req.retention_days != ws.retention_days:
            ws.retention_days = req.retention_days
            changed["retention_days"] = ws.retention_days
        if req.ai_enabled is not None and req.ai_enabled != ws.ai_enabled:
            ws.ai_enabled = req.ai_enabled
            changed["ai_enabled"] = ws.ai_enabled
            if ws.ai_enabled:
                ws.ai_consent_at = datetime.now(UTC)
                ws.ai_consent_by_id = user.id if user else "usr-meera"
                ws.ai_consent_version = req.ai_consent_version or "v1.2-enterprise"
                changed["ai_consent_version"] = ws.ai_consent_version
        if req.timezone is not None and req.timezone != ws.timezone:
            ws.timezone = req.timezone
            changed["timezone"] = ws.timezone
        if req.date_format is not None and req.date_format != ws.date_format:
            ws.date_format = req.date_format
            changed["date_format"] = ws.date_format
        if req.confidential_mode is not None and req.confidential_mode != ws.confidential_mode:
            ws.confidential_mode = req.confidential_mode
            changed["confidential_mode"] = ws.confidential_mode
        if req.redaction_options_json is not None:
            ws.redaction_options_json = req.redaction_options_json
            changed["redaction_options"] = "updated"
        if req.logo_url is not None:
            ws.logo_url = req.logo_url
            changed["logo_url"] = ws.logo_url

    # Admin and Brand Manager both allowed to modify governance & review policy
    if (
        req.manager_approval_severity is not None
        and req.manager_approval_severity != ws.manager_approval_severity
    ):
        ws.manager_approval_severity = req.manager_approval_severity
        changed["manager_approval_severity"] = ws.manager_approval_severity
    if req.default_brand_kit_id is not None and req.default_brand_kit_id != ws.default_brand_kit_id:
        ws.default_brand_kit_id = req.default_brand_kit_id
        changed["default_brand_kit_id"] = ws.default_brand_kit_id
    if req.default_spelling is not None and req.default_spelling != ws.default_spelling:
        ws.default_spelling = req.default_spelling
        changed["default_spelling"] = ws.default_spelling
    if (
        req.require_decision_reason is not None
        and req.require_decision_reason != ws.require_decision_reason
    ):
        ws.require_decision_reason = req.require_decision_reason
        changed["require_decision_reason"] = ws.require_decision_reason
    if req.auto_assign_mode is not None and req.auto_assign_mode != ws.auto_assign_mode:
        ws.auto_assign_mode = req.auto_assign_mode
        changed["auto_assign_mode"] = ws.auto_assign_mode
    if req.sla_hours is not None and req.sla_hours != ws.sla_hours:
        ws.sla_hours = req.sla_hours
        changed["sla_hours"] = ws.sla_hours

    if changed:
        audit_evt = AuditLogModel(
            workspace_id=ws.id,
            actor_id=user.id if user else ("usr-meera" if ctx.role == "Admin" else "usr-anika"),
            actor_role=ctx.role,
            action="WORKSPACE_SETTINGS_UPDATED",
            entity="workspace",
            entity_id=ws.id,
            detail_json=json.dumps(changed),
        )
        db.add(audit_evt)
        db.commit()
        db.refresh(ws)

    return changed


@router.put("/{workspace_id}/settings", response_model=WorkspaceSettingsResponse)
def update_workspace_settings_detailed(
    workspace_id: str,
    req: WorkspaceSettingsUpdateRequest,
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """Update workspace governance settings with strict role gating."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    _apply_settings_update(ws, req, ctx, user, db)
    return get_workspace_settings(workspace_id, ctx, db)


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace_settings(
    workspace_id: str,
    req: WorkspaceSettingsUpdateRequest,
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """Update workspace settings (Standard endpoint)."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    _apply_settings_update(ws, req, ctx, user, db)
    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        industry=ws.industry,
        is_demo=ws.is_demo,
        retention_days=ws.retention_days,
        ai_enabled=ws.ai_enabled,
        timezone=ws.timezone or "Asia/Kolkata",
        date_format=ws.date_format or "YYYY-MM-DD",
        default_brand_kit_id=ws.default_brand_kit_id or "kettle-and-co",
        default_spelling=ws.default_spelling or "en-IN",
        manager_approval_severity=ws.manager_approval_severity or "Blocker",
        require_decision_reason=ws.require_decision_reason
        if ws.require_decision_reason is not None
        else True,
        auto_assign_mode=ws.auto_assign_mode or "off",
        sla_hours=ws.sla_hours or 48,
        confidential_mode=ws.confidential_mode or False,
        redaction_options_json=ws.redaction_options_json or "{}",
        logo_url=ws.logo_url,
        role=ctx.role,
    )


# ---------------------------------------------------------------------------
# Content Types Management
# ---------------------------------------------------------------------------


@router.get("/{workspace_id}/content-types", response_model=list[ContentTypeResponse])
def list_content_types(
    workspace_id: str,
    include_archived: bool = False,
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """List available content types for current workspace."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    q = db.query(ContentTypeModel).filter(ContentTypeModel.workspace_id == workspace_id)
    if not include_archived:
        q = q.filter(ContentTypeModel.is_archived.is_(False))
    records = q.order_by(ContentTypeModel.order_index.asc(), ContentTypeModel.name.asc()).all()

    user_ids = {r.default_reviewer_id for r in records if r.default_reviewer_id}
    users_by_id = {}
    if user_ids:
        users = db.query(UserModel).filter(UserModel.id.in_(user_ids)).all()
        users_by_id = {u.id: u.full_name for u in users}

    return [
        ContentTypeResponse(
            id=r.id,
            workspace_id=r.workspace_id,
            name=r.name,
            description=r.description,
            is_default=r.is_default,
            requires_manager_approval=r.requires_manager_approval,
            default_reviewer_id=r.default_reviewer_id,
            default_reviewer_name=users_by_id.get(r.default_reviewer_id),
            order_index=r.order_index,
            is_archived=r.is_archived,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.post(
    "/{workspace_id}/content-types",
    response_model=ContentTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_content_type(
    workspace_id: str,
    req: CreateContentTypeRequest,
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
):
    """Create a new content type (Admin/Brand manager)."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ct_id = f"ct-{uuid.uuid4().hex[:10]}"
    ct = ContentTypeModel(
        id=ct_id,
        workspace_id=workspace_id,
        name=req.name.strip(),
        description=req.description.strip() if req.description else None,
        is_default=False,
        requires_manager_approval=req.requires_manager_approval,
        default_reviewer_id=req.default_reviewer_id,
        order_index=req.order_index,
        is_archived=False,
    )
    db.add(ct)

    audit_evt = AuditLogModel(
        workspace_id=workspace_id,
        actor_id=user.id if user else "usr-admin",
        actor_role=ctx.role,
        action="CONTENT_TYPE_CREATED",
        entity="content_type",
        entity_id=ct_id,
        detail_json=json.dumps(
            {"name": ct.name, "requires_manager_approval": ct.requires_manager_approval}
        ),
    )
    db.add(audit_evt)
    db.commit()
    db.refresh(ct)

    reviewer_name = None
    if ct.default_reviewer_id:
        rev_user = db.query(UserModel).filter(UserModel.id == ct.default_reviewer_id).first()
        if rev_user:
            reviewer_name = rev_user.full_name

    return ContentTypeResponse(
        id=ct.id,
        workspace_id=ct.workspace_id,
        name=ct.name,
        description=ct.description,
        is_default=ct.is_default,
        requires_manager_approval=ct.requires_manager_approval,
        default_reviewer_id=ct.default_reviewer_id,
        default_reviewer_name=reviewer_name,
        order_index=ct.order_index,
        is_archived=ct.is_archived,
        created_at=ct.created_at,
    )


@router.put("/{workspace_id}/content-types/{content_type_id}", response_model=ContentTypeResponse)
def update_content_type(
    workspace_id: str,
    content_type_id: str,
    req: UpdateContentTypeRequest,
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
):
    """Update content type definition (Admin/Brand manager)."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ct = (
        db.query(ContentTypeModel)
        .filter(
            ContentTypeModel.id == content_type_id,
            ContentTypeModel.workspace_id == workspace_id,
        )
        .first()
    )
    if not ct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content type not found.")

    if req.name is not None:
        ct.name = req.name.strip()
    if req.description is not None:
        ct.description = req.description.strip()
    if req.requires_manager_approval is not None:
        ct.requires_manager_approval = req.requires_manager_approval
    if req.default_reviewer_id is not None:
        ct.default_reviewer_id = req.default_reviewer_id if req.default_reviewer_id else None
    if req.order_index is not None:
        ct.order_index = req.order_index
    if req.is_archived is not None:
        ct.is_archived = req.is_archived

    audit_evt = AuditLogModel(
        workspace_id=workspace_id,
        actor_id=user.id if user else "usr-admin",
        actor_role=ctx.role,
        action="CONTENT_TYPE_UPDATED",
        entity="content_type",
        entity_id=ct.id,
        detail_json=json.dumps(
            {
                "name": ct.name,
                "requires_manager_approval": ct.requires_manager_approval,
                "is_archived": ct.is_archived,
            }
        ),
    )
    db.add(audit_evt)
    db.commit()
    db.refresh(ct)

    reviewer_name = None
    if ct.default_reviewer_id:
        rev_user = db.query(UserModel).filter(UserModel.id == ct.default_reviewer_id).first()
        if rev_user:
            reviewer_name = rev_user.full_name

    return ContentTypeResponse(
        id=ct.id,
        workspace_id=ct.workspace_id,
        name=ct.name,
        description=ct.description,
        is_default=ct.is_default,
        requires_manager_approval=ct.requires_manager_approval,
        default_reviewer_id=ct.default_reviewer_id,
        default_reviewer_name=reviewer_name,
        order_index=ct.order_index,
        is_archived=ct.is_archived,
        created_at=ct.created_at,
    )


@router.delete("/{workspace_id}/content-types/{content_type_id}")
def archive_content_type(
    workspace_id: str,
    content_type_id: str,
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
):
    """Archive a content type so it no longer appears in new submissions."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ct = (
        db.query(ContentTypeModel)
        .filter(
            ContentTypeModel.id == content_type_id,
            ContentTypeModel.workspace_id == workspace_id,
        )
        .first()
    )
    if not ct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content type not found.")

    ct.is_archived = True
    audit_evt = AuditLogModel(
        workspace_id=workspace_id,
        actor_id=user.id if user else "usr-admin",
        actor_role=ctx.role,
        action="CONTENT_TYPE_ARCHIVED",
        entity="content_type",
        entity_id=ct.id,
        detail_json=json.dumps({"name": ct.name}),
    )
    db.add(audit_evt)
    db.commit()
    return {"status": "archived", "id": ct.id, "message": f"Content type '{ct.name}' archived."}


# ---------------------------------------------------------------------------
# Data Retention Policy Execution & Export
# ---------------------------------------------------------------------------


@router.post("/{workspace_id}/retention/run", response_model=RetentionRunResponse)
def run_retention_policy(
    workspace_id: str,
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    """Run data retention policy: prune reviews older than retention_days (Admin only)."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    if ws.retention_days <= 0:
        return RetentionRunResponse(
            deleted_count=0,
            retained_count=db.query(ReviewModel)
            .filter(ReviewModel.workspace_id == workspace_id)
            .count(),
            retention_days=0,
            message="Retention is configured to keep all data indefinitely. No records deleted.",
        )

    cutoff_date = datetime.now(UTC) - timedelta(days=ws.retention_days)

    if ws.is_demo:
        deleted_count = 0
        total_reviews = (
            db.query(ReviewModel).filter(ReviewModel.workspace_id == workspace_id).count()
        )
        message = f"Simulated retention sweep. No reviews older than {ws.retention_days} days in the active 56-day demo window."
    else:
        # In non-demo workspace, delete reviews older than cutoff
        # Strip tzinfo for SQLite datetime comparison
        cutoff_naive = cutoff_date.replace(tzinfo=None)
        expired_reviews = (
            db.query(ReviewModel)
            .filter(
                ReviewModel.workspace_id == workspace_id,
                ReviewModel.created_at < cutoff_naive,
            )
            .all()
        )
        deleted_count = len(expired_reviews)
        for rev in expired_reviews:
            db.delete(rev)
        db.commit()
        total_reviews = (
            db.query(ReviewModel).filter(ReviewModel.workspace_id == workspace_id).count()
        )
        message = f"Retention policy executed. {deleted_count} expired reviews removed."

    audit_evt = AuditLogModel(
        workspace_id=workspace_id,
        actor_id=user.id if user else "usr-meera",
        actor_role="Admin",
        action="RETENTION_POLICY_EXECUTED",
        entity="workspace",
        entity_id=workspace_id,
        detail_json=json.dumps(
            {"retention_days": ws.retention_days, "deleted_count": deleted_count}
        ),
    )
    db.add(audit_evt)
    db.commit()

    return RetentionRunResponse(
        deleted_count=deleted_count,
        retained_count=total_reviews,
        retention_days=ws.retention_days,
        message=message,
    )


@router.get("/{workspace_id}/export")
def export_workspace_data(
    workspace_id: str,
    user: UserModel | None = Depends(get_current_user_optional),
    ctx: WorkspaceContext = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    """Export complete workspace configuration, brand kits, and review statistics (Admin only)."""
    if ctx.workspace_id != workspace_id and not ctx.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    kits = db.query(BrandKitModel).filter(BrandKitModel.workspace_id == workspace_id).all()
    rules = db.query(RuleModel).filter(RuleModel.workspace_id == workspace_id).all()
    facts = db.query(FactModel).filter(FactModel.workspace_id == workspace_id).all()
    content_types = (
        db.query(ContentTypeModel).filter(ContentTypeModel.workspace_id == workspace_id).all()
    )
    review_count = db.query(ReviewModel).filter(ReviewModel.workspace_id == workspace_id).count()

    audit_evt = AuditLogModel(
        workspace_id=workspace_id,
        actor_id=user.id if user else "usr-meera",
        actor_role="Admin",
        action="WORKSPACE_DATA_EXPORTED",
        entity="workspace",
        entity_id=workspace_id,
        detail_json=json.dumps(
            {"brand_kits": len(kits), "rules": len(rules), "reviews": review_count}
        ),
    )
    db.add(audit_evt)
    db.commit()

    return {
        "workspace": {
            "id": ws.id,
            "name": ws.name,
            "industry": ws.industry,
            "timezone": ws.timezone,
            "date_format": ws.date_format,
            "retention_days": ws.retention_days,
            "ai_enabled": ws.ai_enabled,
            "sla_hours": ws.sla_hours,
        },
        "brand_kits_count": len(kits),
        "rules_count": len(rules),
        "facts_count": len(facts),
        "content_types_count": len(content_types),
        "total_reviews": review_count,
        "exported_at": datetime.now(UTC).isoformat(),
    }


@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: str,
    ctx: WorkspaceContext = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    """Delete a workspace and cascade-remove its tenant assets (Admin only, non-demo)."""
    if ctx.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden."
        )

    ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    if ws.is_demo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Demo workspace cannot be deleted."
        )

    db.delete(ws)
    db.commit()
    return {"message": f"Workspace '{ws.name}' deleted successfully."}
