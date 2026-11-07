"""Database seeder loading fictional demo workspace, brand kits, rules, facts, and coherent story."""

from app.models.base import Base, engine
from app.models.entities import ReviewModel, WorkspaceModel
from app.seed.demo_story import seed_demo_story, wipe_demo_workspace
from sqlalchemy.orm import Session


def seed_database(db: Session) -> None:
    """Ensure database tables exist and seed fictional demo workspace data if empty."""
    Base.metadata.create_all(bind=engine)

    # Check if demo workspace exists and is already seeded with reviews
    demo_ws = db.query(WorkspaceModel).filter(WorkspaceModel.id == "ws-demo").first()
    reviews_count = db.query(ReviewModel).filter(ReviewModel.workspace_id == "ws-demo").count()

    if not demo_ws or reviews_count < 30:
        seed_demo_story(db)


def reset_database_seed(db: Session) -> None:
    """Reset demo workspace brand kits, rules, facts, and reviews to clean seed state."""
    wipe_demo_workspace(db)
    seed_demo_story(db)
