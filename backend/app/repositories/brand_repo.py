"""Repository for Brand Kits, Rules, and Facts."""

from app.models.entities import BrandKitModel, FactModel, RuleModel
from sqlalchemy.orm import Session


class BrandRepository:
    """Data access methods for brand knowledge assets."""

    def __init__(self, db: Session):
        self.db = db

    def list_brand_kits(self) -> list[BrandKitModel]:
        """Return all available brand kits."""
        return self.db.query(BrandKitModel).all()

    def get_brand_kit(self, kit_id: str) -> BrandKitModel | None:
        """Get brand kit by ID."""
        return self.db.query(BrandKitModel).filter(BrandKitModel.id == kit_id).first()

    def get_rules_for_kit(self, kit_id: str) -> list[RuleModel]:
        """Get all rules for a brand kit."""
        return self.db.query(RuleModel).filter(RuleModel.kit_id == kit_id).all()

    def get_rule_by_id(self, rule_id: str) -> RuleModel | None:
        """Get rule by ID."""
        return self.db.query(RuleModel).filter(RuleModel.id == rule_id).first()

    def get_facts_for_kit(self, kit_id: str) -> list[FactModel]:
        """Get all facts for a brand kit."""
        return self.db.query(FactModel).filter(FactModel.kit_id == kit_id).all()

    def update_rule(self, rule_id: str, updates: dict) -> RuleModel | None:
        """Update an existing rule and increment version."""
        rule = self.get_rule_by_id(rule_id)
        if not rule:
            return None

        for k, v in updates.items():
            if v is not None and hasattr(rule, k):
                setattr(rule, k, v)

        # Bump minor version string
        try:
            curr = float(rule.version)
            rule.version = f"{curr + 0.1:.1f}"
        except Exception:
            rule.version = "1.1"

        self.db.commit()
        self.db.refresh(rule)
        return rule
