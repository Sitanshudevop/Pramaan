"""Authentication, session lifecycle, and user profile management router."""

import uuid
from datetime import UTC, datetime, timedelta

from app.auth.dependencies import get_current_user
from app.auth.security import (
    create_access_token,
    generate_secure_token,
    hash_password,
    hash_token,
    validate_password_strength,
    verify_password,
)
from app.config import settings
from app.database import get_db
from app.models.entities import (
    AuditLogModel,
    MembershipModel,
    RefreshTokenModel,
    ReviewModel,
    UserModel,
    WorkspaceModel,
)
from app.schemas.schemas import (
    AuthSessionResponse,
    UpdateProfileRequest,
    UserResponse,
    UserSignInRequest,
    UserSignUpRequest,
    WorkspaceResponse,
)
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Set secure httpOnly refresh token cookie."""
    max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    response.set_cookie(
        key="refresh_token",
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/api/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear refresh token cookie on signout."""
    response.delete_cookie(
        key="refresh_token",
        path="/api/auth",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
    )


@router.post("/signup", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED)
def signup(req: UserSignUpRequest, response: Response, db: Session = Depends(get_db)):
    """Sign up a new user with Argon2id hashing and automatically set up initial workspace."""
    # 1. Check existing email
    normalized_email = req.email.strip().lower()
    existing = db.query(UserModel).filter(UserModel.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 2. Validate password complexity
    valid, reason = validate_password_strength(req.password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    # 3. Create user record
    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    user = UserModel(
        id=user_id,
        email=normalized_email,
        password_hash=hash_password(req.password),
        full_name=req.full_name.strip(),
        is_active=True,
    )
    db.add(user)

    # 4. Create primary company workspace for user
    ws_slug = f"{user.full_name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}"
    ws_id = f"ws-{uuid.uuid4().hex[:12]}"
    workspace = WorkspaceModel(
        id=ws_id,
        name=f"{user.full_name}'s Workspace",
        slug=ws_slug,
        industry="Technology",
        is_demo=False,
        retention_days=90,
        ai_enabled=False,
    )
    db.add(workspace)

    # 5. Add user as Workspace Admin
    membership = MembershipModel(
        id=f"mem-{uuid.uuid4().hex[:12]}",
        workspace_id=ws_id,
        user_id=user_id,
        role="Admin",
    )
    db.add(membership)

    # 6. Audit event
    audit_evt = AuditLogModel(
        workspace_id=ws_id,
        actor_id=user_id,
        actor_role="Admin",
        action="WORKSPACE_CREATED",
        entity="workspace",
        entity_id=ws_id,
        detail_json='{"reason": "User sign up initial workspace creation"}',
    )
    db.add(audit_evt)

    # 7. Generate rotating refresh token & set cookie
    raw_refresh = generate_secure_token(32)
    refresh_rec = RefreshTokenModel(
        id=f"ref-{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_rec)
    db.commit()

    _set_refresh_cookie(response, raw_refresh)
    access_token = create_access_token(user.id, user.email, ws_id, "Admin")

    ws_resp = WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        industry=workspace.industry,
        is_demo=False,
        retention_days=workspace.retention_days,
        ai_enabled=workspace.ai_enabled,
        role="Admin",
    )

    return AuthSessionResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        ),
        current_workspace=ws_resp,
        workspaces=[ws_resp],
    )


@router.post("/signin", response_model=AuthSessionResponse)
def signin(req: UserSignInRequest, response: Response, db: Session = Depends(get_db)):
    """Sign in with email and password, protected against brute force enumeration."""
    normalized_email = req.email.strip().lower()
    user = db.query(UserModel).filter(UserModel.email == normalized_email).first()

    now = datetime.now(UTC)

    # Temporary lockout check
    if user and user.lockout_until and user.lockout_until > now:
        mins_remaining = int((user.lockout_until - now).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to repeated failed attempts. Try again in {mins_remaining} minute(s).",
        )

    # Verification
    if not user or not verify_password(req.password, user.password_hash) or not user.is_active:
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.lockout_until = now + timedelta(minutes=15)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
        )

    # Reset failed attempts
    user.failed_login_attempts = 0
    user.lockout_until = None

    # Resolve workspaces
    memberships = db.query(MembershipModel).filter(MembershipModel.user_id == user.id).all()
    if not memberships:
        # Fallback: create primary workspace if user has none
        ws_id = f"ws-{uuid.uuid4().hex[:12]}"
        ws = WorkspaceModel(
            id=ws_id,
            name=f"{user.full_name}'s Workspace",
            slug=f"ws-{uuid.uuid4().hex[:8]}",
            industry="Technology",
            is_demo=False,
        )
        db.add(ws)
        mem = MembershipModel(
            id=f"mem-{uuid.uuid4().hex[:12]}", workspace_id=ws_id, user_id=user.id, role="Admin"
        )
        db.add(mem)
        db.commit()
        memberships = [mem]

    primary_mem = memberships[0]
    workspace = (
        db.query(WorkspaceModel).filter(WorkspaceModel.id == primary_mem.workspace_id).first()
    )

    # Generate rotating refresh token
    raw_refresh = generate_secure_token(32)
    refresh_rec = RefreshTokenModel(
        id=f"ref-{uuid.uuid4().hex[:12]}",
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_rec)
    db.commit()

    _set_refresh_cookie(response, raw_refresh)
    access_token = create_access_token(
        user.id, user.email, workspace.id if workspace else None, primary_mem.role
    )

    all_ws_resps: list[WorkspaceResponse] = []
    for m in memberships:
        w = db.query(WorkspaceModel).filter(WorkspaceModel.id == m.workspace_id).first()
        if w:
            all_ws_resps.append(
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

    curr_ws_resp = (
        all_ws_resps[0]
        if all_ws_resps
        else WorkspaceResponse(
            id="ws-demo",
            name="Demo Workspace",
            slug="demo-workspace",
            industry="Demo",
            is_demo=True,
            retention_days=30,
            ai_enabled=True,
            role="Creator",
        )
    )

    return AuthSessionResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        ),
        current_workspace=curr_ws_resp,
        workspaces=all_ws_resps,
    )


@router.post("/refresh", response_model=AuthSessionResponse)
def refresh_session(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """Rotate refresh token and issue new access token."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing. Please sign in again.",
        )

    t_hash = hash_token(refresh_token)
    token_record = (
        db.query(RefreshTokenModel)
        .filter(
            RefreshTokenModel.token_hash == t_hash,
            RefreshTokenModel.revoked_at.is_(None),
        )
        .first()
    )

    now = datetime.now(UTC)
    if not token_record or token_record.expires_at < now:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or revoked. Please sign in again.",
        )

    # Revoke current refresh token (rotation)
    token_record.revoked_at = now

    user = (
        db.query(UserModel)
        .filter(UserModel.id == token_record.user_id, UserModel.is_active.is_(True))
        .first()
    )
    if not user:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User account disabled."
        )

    # Issue new refresh token
    new_raw_refresh = generate_secure_token(32)
    new_refresh_rec = RefreshTokenModel(
        id=f"ref-{uuid.uuid4().hex[:12]}",
        user_id=user.id,
        token_hash=hash_token(new_raw_refresh),
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_refresh_rec)
    db.commit()

    _set_refresh_cookie(response, new_raw_refresh)

    # Fetch user workspaces
    memberships = db.query(MembershipModel).filter(MembershipModel.user_id == user.id).all()
    all_ws_resps: list[WorkspaceResponse] = []
    for m in memberships:
        w = db.query(WorkspaceModel).filter(WorkspaceModel.id == m.workspace_id).first()
        if w:
            all_ws_resps.append(
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

    curr = (
        all_ws_resps[0]
        if all_ws_resps
        else WorkspaceResponse(
            id="ws-demo",
            name="Demo Workspace",
            slug="demo-workspace",
            industry="Demo",
            is_demo=True,
            retention_days=30,
            ai_enabled=True,
            role="Creator",
        )
    )

    access_token = create_access_token(user.id, user.email, curr.id, curr.role)

    return AuthSessionResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        ),
        current_workspace=curr,
        workspaces=all_ws_resps,
    )


@router.post("/signout")
def signout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """Revoke refresh token and clear session cookies."""
    if refresh_token:
        t_hash = hash_token(refresh_token)
        token_rec = (
            db.query(RefreshTokenModel).filter(RefreshTokenModel.token_hash == t_hash).first()
        )
        if token_rec:
            token_rec.revoked_at = datetime.now(UTC)
            db.commit()

    _clear_refresh_cookie(response)
    return {"message": "Signed out successfully."}


@router.get("/me", response_model=AuthSessionResponse)
def get_me(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch current user identity and list of member workspaces."""
    memberships = db.query(MembershipModel).filter(MembershipModel.user_id == user.id).all()
    all_ws_resps: list[WorkspaceResponse] = []
    for m in memberships:
        w = db.query(WorkspaceModel).filter(WorkspaceModel.id == m.workspace_id).first()
        if w:
            all_ws_resps.append(
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

    curr = (
        all_ws_resps[0]
        if all_ws_resps
        else WorkspaceResponse(
            id="ws-demo",
            name="Demo Workspace",
            slug="demo-workspace",
            industry="Demo",
            is_demo=True,
            retention_days=30,
            ai_enabled=True,
            role="Creator",
        )
    )

    access_token = create_access_token(user.id, user.email, curr.id, curr.role)

    return AuthSessionResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        ),
        current_workspace=curr,
        workspaces=all_ws_resps,
    )


@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: UpdateProfileRequest,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile name, avatar, or change password."""
    if req.full_name:
        user.full_name = req.full_name.strip()
    if req.avatar_url is not None:
        user.avatar_url = req.avatar_url

    if req.new_password:
        if not req.current_password or not verify_password(
            req.current_password, user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required and must be correct to set a new password.",
            )
        valid, reason = validate_password_strength(req.new_password)
        if not valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)
        user.password_hash = hash_password(req.new_password)

    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


@router.post("/export-data")
def export_user_data(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export user personal profile and authored content data as JSON."""
    authored_reviews = db.query(ReviewModel).filter(ReviewModel.creator_id == user.id).all()
    return {
        "profile": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat(),
        },
        "authored_reviews_count": len(authored_reviews),
        "exported_at": datetime.now(UTC).isoformat(),
    }


@router.delete("/account")
def delete_account(
    response: Response,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Anonymize and delete user account upon confirmation."""
    # Anonymize authored reviews
    db.query(ReviewModel).filter(ReviewModel.creator_id == user.id).update({"creator_id": None})
    db.query(ReviewModel).filter(ReviewModel.assignee_id == user.id).update({"assignee_id": None})

    # Delete memberships, refresh tokens, and user
    db.query(MembershipModel).filter(MembershipModel.user_id == user.id).delete()
    db.query(RefreshTokenModel).filter(RefreshTokenModel.user_id == user.id).delete()
    db.delete(user)
    db.commit()

    _clear_refresh_cookie(response)
    return {"message": "Account successfully deleted."}
