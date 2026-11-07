"""FastAPI application entrypoint for Pramaan."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api import audit, auth, brands, health, insights, notifications, reviews, workspaces
from app.deps import limiter
from app.models.base import SessionLocal
from app.security import SecurityHeadersMiddleware
from app.seed.loader import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup initialization: auto-seed database with fictional demo kits."""
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Pramaan API",
    description="Evidence-backed pre-publication brand governance workspace API.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

# Attach rate limiter
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Standardized rate limit response."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Rate limit exceeded. Please wait a moment.",
            }
        },
    )


# Security headers & CORS
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)


@app.api_route("/", methods=["GET", "HEAD"], tags=["Root"])
def root() -> dict[str, str]:
    """Root status indicator with link to interactive API documentation."""
    return {
        "name": "Pramaan API",
        "status": "healthy",
        "version": "0.1.0",
        "docs_url": "/api/docs",
    }


app.include_router(auth.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(brands.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(reviews.router)
app.include_router(audit.router)
app.include_router(insights.router)
