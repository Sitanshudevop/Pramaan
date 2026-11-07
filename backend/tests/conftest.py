"""Pytest fixtures and isolated in-memory test database initialization."""

import pytest
from app.database import get_db
from app.main import app
from app.models.base import Base
from app.seed.loader import seed_database
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Isolated in-memory SQLite database dedicated to tests
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables and seed brand data into isolated test database."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@pytest.fixture(autouse=True)
def override_db_dependency():
    """Override get_db FastAPI dependency to use isolated test database session."""

    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)

