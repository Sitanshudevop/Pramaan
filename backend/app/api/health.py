"""Health check endpoint exposing no internal environment details."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
@router.get("/api/health")
def health_check() -> dict[str, str]:
    """Calm health check endpoint for uptime probes."""
    return {"status": "ok"}
