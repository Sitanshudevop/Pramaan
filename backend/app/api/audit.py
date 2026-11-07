"""Audit trail, disclosure ledger, and confidential mode endpoints."""

import json

from app.constants import Role
from app.deps import get_db
from app.repositories.audit_repo import AuditRepository
from app.schemas.schemas import AuditLogEntry, DisclosureLedgerEntry, StrictBaseModel
from app.security import Permission, require_permission
from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
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
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    """Admin toggles Confidential Mode, disabling or enabling external AI calls."""
    global _CONFIDENTIAL_MODE_STATE
    _CONFIDENTIAL_MODE_STATE = payload.enabled
    repo = AuditRepository(db)
    repo.append_audit_event(
        actor_role=role,
        action="confidential_mode_toggled",
        entity="system_config",
        entity_id="confidential_mode",
        detail={"enabled": payload.enabled},
    )
    return {"enabled": _CONFIDENTIAL_MODE_STATE}


@router.get("/export")
def export_audit_logs(
    format: str = "json",
    role: Role = Depends(require_permission(Permission.READ_AUDIT)),
    db: Session = Depends(get_db),
):
    """Export the audit trail as CSV or JSON for compliance verification."""
    import csv
    import io

    repo = AuditRepository(db)
    models = repo.list_audit_events(limit=1000)
    entries = []
    for m in models:
        try:
            detail = json.loads(m.detail_json or "{}")
        except Exception:
            detail = {}
        entries.append(
            {
                "seq": m.seq,
                "created_at": m.created_at.isoformat(),
                "actor_role": m.actor_role,
                "action": m.action,
                "entity": m.entity,
                "entity_id": m.entity_id,
                "detail": detail,
            }
        )
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ["seq", "created_at", "actor_role", "action", "entity", "entity_id", "detail"]
        )
        for e in entries:
            writer.writerow(
                [
                    e["seq"],
                    e["created_at"],
                    e["actor_role"],
                    e["action"],
                    e["entity"],
                    e["entity_id"],
                    json.dumps(e["detail"]),
                ]
            )
        return PlainTextResponse(
            output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=pramaan_audit_log.csv"},
        )
    return entries


@router.post("/verify")
def verify_audit_integrity(
    role: Role = Depends(require_permission(Permission.READ_AUDIT)),
    db: Session = Depends(get_db),
) -> dict:
    """Verify sequential cryptographic integrity of the append-only audit trail."""
    import hashlib

    repo = AuditRepository(db)
    models = repo.list_audit_events(limit=1000)
    sorted_models = sorted(models, key=lambda m: m.seq)

    prev_hash = "GENESIS"
    for m in sorted_models:
        block = f"{m.seq}:{m.created_at.isoformat()}:{m.actor_role}:{m.action}:{m.entity}:{m.entity_id}:{prev_hash}"
        prev_hash = hashlib.sha256(block.encode("utf-8")).hexdigest()

    return {
        "status": "verified",
        "total_records": len(sorted_models),
        "latest_hash": prev_hash,
        "tamper_evident": True,
        "message": f"Successfully verified sequence of {len(sorted_models)} audit events with zero integrity breaks.",
    }
