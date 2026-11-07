"""Health check endpoint exposing no internal environment details."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.api_route("/health", methods=["GET", "HEAD"])
@router.api_route("/api/health", methods=["GET", "HEAD"])
def health_check() -> dict[str, str]:
    """Calm health check endpoint for uptime probes."""
    return {"status": "ok"}
