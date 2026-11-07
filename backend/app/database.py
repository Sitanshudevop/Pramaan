"""Database dependency re-export for compatibility."""

from app.deps import get_db
from app.models.base import Base, SessionLocal, engine

__all__ = ["get_db", "SessionLocal", "engine", "Base"]

