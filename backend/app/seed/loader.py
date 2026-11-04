"""Database seeder loading fictional brand kits, rules, facts, and simulated events."""

import json
from pathlib import Path

from app.models.base import Base, engine
from app.models.entities import (
    BrandKitModel,
    FactModel,
    RuleModel,
    SimulatedEventModel,
)
from sqlalchemy.orm import Session


def seed_database(db: Session) -> None:
    """Ensure database tables exist and seed fictional demo data if empty."""
    Base.metadata.create_all(bind=engine)

    seed_dir = Path(__file__).parent
    brand_kits_path = seed_dir / "brand_kits.json"
    simulated_events_path = seed_dir / "simulated_events.json"

    # 1. Seed Brand Kits, Rules, and Facts
    if db.query(BrandKitModel).count() == 0 and brand_kits_path.exists():
        with open(brand_kits_path, encoding="utf-8") as f:
            kits_data = json.load(f)

        for kit_item in kits_data:
            kit_model = BrandKitModel(
                id=kit_item["id"],
                name=kit_item["name"],
                tagline=kit_item["tagline"],
                industry=kit_item["industry"],
                description=kit_item["description"],
                voice_tone=kit_item["voice_tone"],
                target_reading_level=kit_item.get("target_reading_level", 8),
                primary_color=kit_item.get("primary_color", "#1F7A5C"),
            )
            db.add(kit_model)

            # Rules
            for r in kit_item.get("rules", []):
                rule_model = RuleModel(
                    id=r["id"],
                    kit_id=kit_item["id"],
                    category=r["category"],
                    title=r["title"],
                    text=r["text"],
                    banned_terms_json=json.dumps(r.get("banned_terms", [])),
                    severity=r["severity"],
                    version=r.get("version", "1.0"),
                    status=r.get("status", "active"),
                    effective_from=r.get("effective_from", "2026-01-01"),
                    owner=r.get("owner", "Governance Lead"),
                    source=r.get("source", "Brand Guidelines 2026"),
                )
                db.add(rule_model)

            # Facts
            for fact in kit_item.get("facts", []):
                fact_model = FactModel(
                    id=fact["id"],
                    kit_id=kit_item["id"],
                    subject=fact["subject"],
                    value=fact["value"],
                    unit=fact["unit"],
                    valid_from=fact["valid_from"],
                    valid_to=fact["valid_to"],
                    permitted_wording=fact["permitted_wording"],
                    owner=fact.get("owner", "Operations"),
                    source=fact.get("source", "Facts Register 2026"),
                    status=fact.get("status", "active"),
                )
                db.add(fact_model)

        db.commit()

    # 2. Seed Simulated Events for Insights
    if db.query(SimulatedEventModel).count() == 0 and simulated_events_path.exists():
        with open(simulated_events_path, encoding="utf-8") as f:
            events_data = json.load(f)

        from datetime import datetime

        for evt in events_data:
            dt = datetime.fromisoformat(evt["created_at"])
            event_model = SimulatedEventModel(
                id=evt["id"],
                simulated=True,
                brand_kit_id=evt["brand_kit_id"],
                rule_id=evt["rule_id"],
                rule_name=evt["rule_name"],
                category=evt["category"],
                severity=evt["severity"],
                action=evt["action"],
                actor_role=evt["actor_role"],
                reason=evt.get("reason"),
                created_at=dt,
            )
            db.add(event_model)

        db.commit()
