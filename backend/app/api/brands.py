"""Brand knowledge hub endpoints."""

import json
from pathlib import Path
from typing import Any

from app.constants import Role
from app.deps import get_db
from app.models.entities import BrandKitModel
from app.repositories.brand_repo import BrandRepository
from app.schemas.schemas import (
    BrandKitSummary,
    FactItem,
    RuleItem,
    UpdateRuleRequest,
)
from app.security import Permission, require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/brands", tags=["brands"])


def _format_brand_kit(kit: BrandKitModel) -> BrandKitSummary:
    return BrandKitSummary(
        id=kit.id,
        name=kit.name,
        tagline=kit.tagline,
        industry=kit.industry,
        description=kit.description,
        voice_tone=kit.voice_tone,
        target_reading_level=kit.target_reading_level,
        primary_color=kit.primary_color,
        rules=[
            RuleItem(
                id=r.id,
                kit_id=r.kit_id,
                category=r.category,
                title=r.title,
                text=r.text,
                banned_terms=r.banned_terms,
                severity=r.severity,
                version=r.version,
                status=r.status,
                effective_from=r.effective_from,
                owner=r.owner,
                source=r.source,
            )
            for r in kit.rules
        ],
        facts=[
            FactItem(
                id=f.id,
                kit_id=f.kit_id,
                subject=f.subject,
                value=f.value,
                unit=f.unit,
                valid_from=f.valid_from,
                valid_to=f.valid_to,
                permitted_wording=f.permitted_wording,
                owner=f.owner,
                source=f.source,
                status=f.status,
            )
            for f in kit.facts
        ],
    )


@router.get("", response_model=list[BrandKitSummary])
def list_brands(db: Session = Depends(get_db)) -> list[BrandKitSummary]:
    """Retrieve all brand kits with their active guidelines and facts register."""
    repo = BrandRepository(db)
    kits = repo.list_brand_kits()
    return [_format_brand_kit(k) for k in kits]


@router.get("/samples/drafts")
def get_sample_drafts() -> list[dict[str, Any]]:
    """Retrieve pre-seeded sample drafts for one-click demo testing."""
    sample_path = Path(__file__).parent.parent / "seed" / "sample_drafts.json"
    if sample_path.exists():
        with open(sample_path, encoding="utf-8") as f:
            return json.load(f)
    return []


@router.get("/{kit_id}", response_model=BrandKitSummary)
def get_brand_kit(kit_id: str, db: Session = Depends(get_db)) -> BrandKitSummary:
    """Get single brand kit details."""
    repo = BrandRepository(db)
    kit = repo.get_brand_kit(kit_id)
    if not kit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Brand kit '{kit_id}' not found"}},
        )
    return _format_brand_kit(kit)


@router.patch("/{kit_id}/rules/{rule_id}", response_model=RuleItem)
def update_rule(
    kit_id: str,
    rule_id: str,
    payload: UpdateRuleRequest,
    role: Role = Depends(require_permission(Permission.PUBLISH_GUIDELINES)),
    db: Session = Depends(get_db),
) -> RuleItem:
    """Brand manager updates an active guideline and increments its version."""
    repo = BrandRepository(db)
    updates = {}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.text is not None:
        updates["text"] = payload.text
    if payload.severity is not None:
        updates["severity"] = payload.severity.value
    if payload.banned_terms is not None:
        updates["banned_terms_json"] = json.dumps(payload.banned_terms)

    updated = repo.update_rule(rule_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Rule '{rule_id}' not found"}},
        )

    return RuleItem(
        id=updated.id,
        kit_id=updated.kit_id,
        category=updated.category,
        title=updated.title,
        text=updated.text,
        banned_terms=updated.banned_terms,
        severity=updated.severity,
        version=updated.version,
        status=updated.status,
        effective_from=updated.effective_from,
        owner=updated.owner,
        source=updated.source,
    )
