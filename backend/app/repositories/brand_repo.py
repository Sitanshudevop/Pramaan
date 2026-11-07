"""Repository for Brand Kits, Rules, Facts, and Claims scoped by workspace."""

import json
import uuid

from app.models.entities import (
    BrandKitModel,
    ClaimPatternModel,
    FactModel,
    GlossaryTermModel,
    RuleModel,
)
from sqlalchemy.orm import Session


class BrandRepository:
    """Data access methods for brand knowledge assets with strict tenant scoping."""

    def __init__(self, db: Session, workspace_id: str = "ws-demo"):
        self.db = db
        self.workspace_id = workspace_id

    def list_brand_kits(self, include_archived: bool = False) -> list[BrandKitModel]:
        """Return brand kits belonging to this workspace."""
        q = self.db.query(BrandKitModel).filter(BrandKitModel.workspace_id == self.workspace_id)
        if not include_archived:
            q = q.filter(BrandKitModel.is_archived.is_(False))
        return q.all()

    def get_brand_kit(self, kit_id: str) -> BrandKitModel | None:
        """Get brand kit by ID within the current tenant workspace."""
        return (
            self.db.query(BrandKitModel)
            .filter(
                BrandKitModel.id == kit_id,
                BrandKitModel.workspace_id == self.workspace_id,
            )
            .first()
        )

    def create_brand_kit(self, data: dict) -> BrandKitModel:
        """Create new brand kit."""
        kit_id = data.get("id") or f"kit-{uuid.uuid4().hex[:10]}"
        kit = BrandKitModel(
            id=kit_id,
            workspace_id=self.workspace_id,
            name=data.get("name", "New Brand Kit"),
            tagline=data.get("tagline", ""),
            industry=data.get("industry", "General"),
            description=data.get("description", ""),
            voice_tone=data.get("voice_tone", ""),
            primary_language=data.get("primary_language", "en-IN"),
            target_reading_level=data.get("target_reading_level", 8),
            primary_color=data.get("primary_color", "#FF8A4C"),
            brand_colors_json=json.dumps(data.get("brand_colors", [])),
            default_disclosure=data.get("default_disclosure"),
            is_archived=False,
        )
        self.db.add(kit)
        self.db.commit()
        self.db.refresh(kit)
        return kit

    def update_brand_kit(self, kit_id: str, updates: dict) -> BrandKitModel | None:
        """Update brand kit metadata."""
        kit = self.get_brand_kit(kit_id)
        if not kit:
            return None

        if "name" in updates and updates["name"]:
            kit.name = updates["name"]
        if "tagline" in updates and updates["tagline"] is not None:
            kit.tagline = updates["tagline"]
        if "industry" in updates and updates["industry"]:
            kit.industry = updates["industry"]
        if "description" in updates and updates["description"] is not None:
            kit.description = updates["description"]
        if "voice_tone" in updates and updates["voice_tone"] is not None:
            kit.voice_tone = updates["voice_tone"]
        if "primary_language" in updates and updates["primary_language"]:
            kit.primary_language = updates["primary_language"]
        if "target_reading_level" in updates and updates["target_reading_level"] is not None:
            kit.target_reading_level = updates["target_reading_level"]
        if "primary_color" in updates and updates["primary_color"]:
            kit.primary_color = updates["primary_color"]
        if "brand_colors" in updates and updates["brand_colors"] is not None:
            kit.brand_colors_json = json.dumps(updates["brand_colors"])
        if "default_disclosure" in updates and updates["default_disclosure"] is not None:
            kit.default_disclosure = updates["default_disclosure"]
        if "is_archived" in updates and updates["is_archived"] is not None:
            kit.is_archived = updates["is_archived"]

        self.db.commit()
        self.db.refresh(kit)
        return kit

    def get_rules_for_kit(self, kit_id: str, status: str | None = None) -> list[RuleModel]:
        """Get rules for brand kit in workspace."""
        q = self.db.query(RuleModel).filter(
            RuleModel.kit_id == kit_id,
            RuleModel.workspace_id == self.workspace_id,
        )
        if status:
            q = q.filter(RuleModel.status == status)
        return q.all()

    def get_rule_by_id(self, rule_id: str) -> RuleModel | None:
        """Get rule by ID in workspace."""
        return (
            self.db.query(RuleModel)
            .filter(
                RuleModel.id == rule_id,
                RuleModel.workspace_id == self.workspace_id,
            )
            .first()
        )

    def create_rule(self, kit_id: str, data: dict) -> RuleModel:
        """Create new rule."""
        rule_id = data.get("id") or f"RULE-{uuid.uuid4().hex[:6].upper()}"
        banned = data.get("banned_terms", [])
        types = data.get("applies_to_content_types", [])

        rule = RuleModel(
            id=rule_id,
            workspace_id=self.workspace_id,
            kit_id=kit_id,
            category=data.get("category", "Terminology"),
            title=data.get("title", "New Rule"),
            text=data.get("text", ""),
            banned_terms_json=json.dumps(banned),
            preferred_replacement=data.get("preferred_replacement"),
            allow_in_quotes=data.get("allow_in_quotes", False),
            placement_hint=data.get("placement_hint", "anywhere"),
            applies_to_content_types_json=json.dumps(types),
            severity=data.get("severity", "Major"),
            version="1.0",
            status=data.get("status", "active"),
            effective_from=data.get("effective_from", "2026-01-01"),
            owner=data.get("owner", "Brand Team"),
            source=data.get("source", "Brand Manual"),
        )
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def update_rule(self, rule_id: str, updates: dict) -> RuleModel | None:
        """Update existing rule."""
        rule = self.get_rule_by_id(rule_id)
        if not rule:
            return None

        if "category" in updates and updates["category"]:
            rule.category = updates["category"]
        if "title" in updates and updates["title"]:
            rule.title = updates["title"]
        if "text" in updates and updates["text"]:
            rule.text = updates["text"]
        if "banned_terms" in updates and updates["banned_terms"] is not None:
            rule.banned_terms_json = json.dumps(updates["banned_terms"])
        if "preferred_replacement" in updates:
            rule.preferred_replacement = updates["preferred_replacement"]
        if "allow_in_quotes" in updates and updates["allow_in_quotes"] is not None:
            rule.allow_in_quotes = updates["allow_in_quotes"]
        if "placement_hint" in updates and updates["placement_hint"]:
            rule.placement_hint = updates["placement_hint"]
        if (
            "applies_to_content_types" in updates
            and updates["applies_to_content_types"] is not None
        ):
            rule.applies_to_content_types_json = json.dumps(updates["applies_to_content_types"])
        if "severity" in updates and updates["severity"]:
            rule.severity = updates["severity"]
        if "status" in updates and updates["status"]:
            rule.status = updates["status"]
        if "effective_from" in updates and updates["effective_from"]:
            rule.effective_from = updates["effective_from"]
        if "owner" in updates and updates["owner"]:
            rule.owner = updates["owner"]
        if "source" in updates and updates["source"]:
            rule.source = updates["source"]

        self.db.commit()
        self.db.refresh(rule)
        return rule

    def get_facts_for_kit(self, kit_id: str, status: str | None = None) -> list[FactModel]:
        """Get facts for brand kit in workspace."""
        q = self.db.query(FactModel).filter(
            FactModel.kit_id == kit_id,
            FactModel.workspace_id == self.workspace_id,
        )
        if status:
            q = q.filter(FactModel.status == status)
        return q.all()

    def get_fact_by_id(self, fact_id: str) -> FactModel | None:
        """Get fact by ID in workspace."""
        return (
            self.db.query(FactModel)
            .filter(
                FactModel.id == fact_id,
                FactModel.workspace_id == self.workspace_id,
            )
            .first()
        )

    def create_fact(self, kit_id: str, data: dict) -> FactModel:
        """Create new fact with aliases."""
        fact_id = data.get("id") or f"FACT-{uuid.uuid4().hex[:6].upper()}"
        aliases = data.get("aliases", [])

        fact = FactModel(
            id=fact_id,
            workspace_id=self.workspace_id,
            kit_id=kit_id,
            subject=data.get("subject", ""),
            aliases_json=json.dumps(aliases),
            value=data.get("value", ""),
            unit=data.get("unit", ""),
            valid_from=data.get("valid_from", "2026-01-01"),
            valid_to=data.get("valid_to", "2027-12-31"),
            permitted_wording=data.get("permitted_wording", ""),
            owner=data.get("owner", "Operations"),
            source=data.get("source", "Facts Register"),
            status=data.get("status", "active"),
        )
        self.db.add(fact)
        self.db.commit()
        self.db.refresh(fact)
        return fact

    def update_fact(self, fact_id: str, updates: dict) -> FactModel | None:
        """Update existing fact."""
        fact = self.get_fact_by_id(fact_id)
        if not fact:
            return None

        if "subject" in updates and updates["subject"]:
            fact.subject = updates["subject"]
        if "aliases" in updates and updates["aliases"] is not None:
            fact.aliases_json = json.dumps(updates["aliases"])
        if "value" in updates and updates["value"] is not None:
            fact.value = updates["value"]
        if "unit" in updates and updates["unit"] is not None:
            fact.unit = updates["unit"]
        if "valid_from" in updates and updates["valid_from"]:
            fact.valid_from = updates["valid_from"]
        if "valid_to" in updates and updates["valid_to"]:
            fact.valid_to = updates["valid_to"]
        if "permitted_wording" in updates and updates["permitted_wording"]:
            fact.permitted_wording = updates["permitted_wording"]
        if "owner" in updates and updates["owner"]:
            fact.owner = updates["owner"]
        if "source" in updates and updates["source"]:
            fact.source = updates["source"]
        if "status" in updates and updates["status"]:
            fact.status = updates["status"]

        self.db.commit()
        self.db.refresh(fact)
        return fact

    def get_claims_for_kit(self, kit_id: str) -> list[ClaimPatternModel]:
        """Get claim patterns for brand kit in workspace."""
        return (
            self.db.query(ClaimPatternModel)
            .filter(
                ClaimPatternModel.kit_id == kit_id,
                ClaimPatternModel.workspace_id == self.workspace_id,
            )
            .all()
        )

    def create_claim_pattern(self, kit_id: str, data: dict) -> ClaimPatternModel:
        """Create claim pattern."""
        claim_id = f"CLM-{uuid.uuid4().hex[:6].upper()}"
        claim = ClaimPatternModel(
            id=claim_id,
            workspace_id=self.workspace_id,
            kit_id=kit_id,
            pattern=data["pattern"],
            category=data.get("category", "Promotional claims"),
            severity=data.get("severity", "Major"),
            substantiating_fact_id=data.get("substantiating_fact_id"),
            reason=data.get("reason", "Restricted claim pattern"),
            status="active",
        )
        self.db.add(claim)
        self.db.commit()
        self.db.refresh(claim)
        return claim

    def get_glossary_for_kit(self, kit_id: str) -> list[GlossaryTermModel]:
        """Get glossary terms for brand kit in workspace."""
        return (
            self.db.query(GlossaryTermModel)
            .filter(
                GlossaryTermModel.kit_id == kit_id,
                GlossaryTermModel.workspace_id == self.workspace_id,
            )
            .all()
        )

    def create_glossary_term(self, kit_id: str, data: dict) -> GlossaryTermModel:
        """Create glossary term."""
        term_id = f"GLO-{uuid.uuid4().hex[:6].upper()}"
        term = GlossaryTermModel(
            id=term_id,
            workspace_id=self.workspace_id,
            kit_id=kit_id,
            term=data["term"],
            preferred_casing=data["preferred_casing"],
            definition=data.get("definition"),
        )
        self.db.add(term)
        self.db.commit()
        self.db.refresh(term)
        return term
