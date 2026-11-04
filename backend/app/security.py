"""Security controls, role validation, and permission enforcement."""

from collections.abc import Callable
from enum import Enum

from fastapi import Header, HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.constants import Role


class Permission(str, Enum):
    """Granular permissions checked across endpoints."""

    SUBMIT_CONTENT = "submit_content"
    VIEW_FINDINGS = "view_findings"
    ACT_ON_FINDINGS = "act_on_findings"
    COMMENT_REQUEST_CHANGES = "comment_request_changes"
    OVERRIDE_FINDING = "override_finding"
    APPROVE_REJECT = "approve_reject"
    APPROVE_GATED = "approve_gated"
    PROPOSE_GUIDELINES = "propose_guidelines"
    PUBLISH_GUIDELINES = "publish_guidelines"
    VIEW_INSIGHTS = "view_insights"
    MANAGE_AI_SETTINGS = "manage_ai_settings"
    READ_AUDIT = "read_audit"


# Permission mapping per Section 9 matrix
ROLE_PERMISSIONS: dict[Role, set[Permission]] = {
    Role.CREATOR: {
        Permission.SUBMIT_CONTENT,
        Permission.VIEW_FINDINGS,
        Permission.ACT_ON_FINDINGS,
        Permission.COMMENT_REQUEST_CHANGES,
        Permission.READ_AUDIT,
    },
    Role.REVIEWER: {
        Permission.VIEW_FINDINGS,
        Permission.COMMENT_REQUEST_CHANGES,
        Permission.OVERRIDE_FINDING,
        Permission.APPROVE_REJECT,
        Permission.PROPOSE_GUIDELINES,
        Permission.VIEW_INSIGHTS,
        Permission.READ_AUDIT,
    },
    Role.BRAND_MANAGER: {
        Permission.SUBMIT_CONTENT,
        Permission.VIEW_FINDINGS,
        Permission.COMMENT_REQUEST_CHANGES,
        Permission.OVERRIDE_FINDING,
        Permission.APPROVE_REJECT,
        Permission.APPROVE_GATED,
        Permission.PROPOSE_GUIDELINES,
        Permission.PUBLISH_GUIDELINES,
        Permission.VIEW_INSIGHTS,
        Permission.READ_AUDIT,
    },
    Role.ADMIN: {
        Permission.PROPOSE_GUIDELINES,
        Permission.VIEW_INSIGHTS,
        Permission.MANAGE_AI_SETTINGS,
        Permission.READ_AUDIT,
    },
}


def get_current_role(x_demo_role: str = Header(default="Creator")) -> Role:
    """Extract and validate the active demo role from the X-Demo-Role header."""
    try:
        return Role(x_demo_role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_ROLE",
                    "message": (
                        f"Invalid demo role '{x_demo_role}'. Allowed roles: "
                        f"{', '.join([r.value for r in Role])}."
                    ),
                }
            },
        )


def require_permission(permission: Permission) -> Callable[[Role], Role]:
    """Dependency factory ensuring the calling role has the requisite permission."""

    def dependency(role: Role = Header(default="Creator", alias="X-Demo-Role")) -> Role:
        # Resolve to valid Role enum
        try:
            active_role = Role(role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_ROLE",
                        "message": f"Invalid demo role '{role}'.",
                    }
                },
            )

        allowed = ROLE_PERMISSIONS.get(active_role, set())
        if permission not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "FORBIDDEN",
                        "message": (
                            f"Role '{active_role.value}' does not have permission for "
                            f"'{permission.value}'. Switch your role in the top-bar demo role switcher."
                        ),
                    }
                },
            )
        return active_role

    return dependency


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforce strict browser security headers on all responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000; "
            "frame-ancestors 'none';"
        )
        return response
