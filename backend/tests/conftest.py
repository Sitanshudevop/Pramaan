"""Pytest fixtures and test database initialization."""

import pytest
from app.models.base import Base, SessionLocal, engine
from app.seed.loader import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables and seed fictional brand data before test suite runs."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
