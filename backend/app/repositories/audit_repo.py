"""Repository for Append-Only Audit Trail and Disclosure Ledger."""

import json
from typing import Any

from app.constants import Role
from app.models.entities import AuditLogModel, DisclosureLedgerModel
from sqlalchemy.orm import Session


class AuditRepository:
    """Provides strictly append-only persistence. No update or delete methods exist."""

    def __init__(self, db: Session):
        self.db = db

    def append_audit_event(
        self,
        actor_role: Role,
        action: str,
        entity: str,
        entity_id: str,
        detail: dict[str, Any],
    ) -> AuditLogModel:
        """Append an audit record to the immutable ledger without raw content."""
        # Sanitize details to guarantee zero draft content leakage
        clean_detail = {
            k: v for k, v in detail.items() if k not in ("content", "text", "prompt", "draft")
        }

        event = AuditLogModel(
            actor_role=actor_role.value if hasattr(actor_role, "value") else str(actor_role),
            action=action,
            entity=entity,
            entity_id=entity_id,
            detail_json=json.dumps(clean_detail),
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def list_audit_events(self, limit: int = 100) -> list[AuditLogModel]:
        """Return the most recent audit trail records in reverse chronological order."""
        return self.db.query(AuditLogModel).order_by(AuditLogModel.seq.desc()).limit(limit).all()

    def append_disclosure(
        self,
        review_id: str,
        provider: str,
        model: str,
        data_class: str,
        pii_redacted: bool,
        token_count: int = 0,
    ) -> DisclosureLedgerModel:
        """Record an immutable entry in the AI Disclosure Ledger."""
        import uuid

        entry = DisclosureLedgerModel(
            id=f"disc-{uuid.uuid4().hex[:12]}",
            review_id=review_id,
            provider=provider,
            model=model,
            data_class=data_class,
            pii_redacted=pii_redacted,
            token_count=token_count,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def list_disclosures(self, limit: int = 100) -> list[DisclosureLedgerModel]:
        """Return the most recent AI disclosures."""
        return (
            self.db.query(DisclosureLedgerModel)
            .order_by(DisclosureLedgerModel.created_at.desc())
            .limit(limit)
            .all()
        )
