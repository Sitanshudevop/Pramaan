"""Audit trail, disclosure ledger, and confidential mode endpoints."""

import json

from app.constants import Role
from app.deps import get_db
from app.repositories.audit_repo import AuditRepository
from app.schemas.schemas import AuditLogEntry, DisclosureLedgerEntry, StrictBaseModel
from app.security import Permission, require_permission
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/audit", tags=["audit"])

# Runtime in-memory toggle for Confidential Mode (Admin-controlled)
_CONFIDENTIAL_MODE_STATE: bool = False


class ConfidentialModePayload(StrictBaseModel):
    enabled: bool


@router.get("/logs", response_model=list[AuditLogEntry])
def get_audit_logs(
    limit: int = 100,
    role: Role = Depends(require_permission(Permission.READ_AUDIT)),
    db: Session = Depends(get_db),
) -> list[AuditLogEntry]:
    """Retrieve immutable append-only audit trail records."""
    repo = AuditRepository(db)
    models = repo.list_audit_events(limit=limit)
    entries = []
    for m in models:
        try:
            detail = json.loads(m.detail_json or "{}")
        except Exception:
            detail = {}
        entries.append(
            AuditLogEntry(
                seq=m.seq,
                created_at=m.created_at,
                actor_role=Role(m.actor_role),
                action=m.action,
                entity=m.entity,
                entity_id=m.entity_id,
                detail=detail,
            )
        )
    return entries


@router.get("/disclosures", response_model=list[DisclosureLedgerEntry])
def get_disclosures(
    limit: int = 100,
    role: Role = Depends(require_permission(Permission.READ_AUDIT)),
    db: Session = Depends(get_db),
) -> list[DisclosureLedgerEntry]:
    """Retrieve AI and data processing disclosure records."""
    repo = AuditRepository(db)
    models = repo.list_disclosures(limit=limit)
    return [
        DisclosureLedgerEntry(
            id=m.id,
            review_id=m.review_id,
            provider=m.provider,
            model=m.model,
            data_class=m.data_class,
            pii_redacted=m.pii_redacted,
            token_count=m.token_count,
            created_at=m.created_at,
        )
        for m in models
    ]


@router.get("/confidential-mode")
def get_confidential_mode() -> dict[str, bool]:
    """Get active state of Confidential Mode."""
    return {"enabled": _CONFIDENTIAL_MODE_STATE}


@router.post("/confidential-mode")
def set_confidential_mode(
    payload: ConfidentialModePayload,
    role: Role = Depends(require_permission(Permission.MANAGE_AI_SETTINGS)),
) -> dict[str, bool]:
    """Admin toggles Confidential Mode, disabling or enabling external AI calls."""
    global _CONFIDENTIAL_MODE_STATE
    _CONFIDENTIAL_MODE_STATE = payload.enabled
    return {"enabled": _CONFIDENTIAL_MODE_STATE}
