"""Brand knowledge hub endpoints scoped by multi-tenant workspace."""

import json
from pathlib import Path
from typing import Any

from app.auth.dependencies import (
    WorkspaceContext,
    get_workspace_context,
    require_role,
)
from app.database import get_db
from app.models.entities import BrandKitModel
from app.repositories.brand_repo import BrandRepository
from app.schemas.schemas import (
    BrandKitSummary,
    CreateBrandKitRequest,
    CreateClaimPatternRequest,
    CreateFactRequest,
    CreateGlossaryTermRequest,
    CreateRuleRequest,
    FactItem,
    RuleItem,
    UpdateBrandKitRequest,
    UpdateFactRequest,
    UpdateRuleRequest,
    BulkImportRulesRequest,
    GuidelineExtractRequest,
)
import csv
import io
import re
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/brands", tags=["Brand Hub"])


def _format_brand_kit(kit: BrandKitModel) -> BrandKitSummary:
    return BrandKitSummary(
        id=kit.id,
        name=kit.name,
        tagline=kit.tagline or "",
        industry=kit.industry,
        description=kit.description or "",
        voice_tone=kit.voice_tone or "",
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
            if r.status != "superseded"
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
            if f.status != "superseded"
        ],
    )


@router.get("", response_model=list[BrandKitSummary])
def list_brands(
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
) -> list[BrandKitSummary]:
    """Retrieve all brand kits within the active workspace."""
    repo = BrandRepository(db, ctx.workspace_id)
    kits = repo.list_brand_kits()
    return [_format_brand_kit(k) for k in kits]


@router.post("", response_model=BrandKitSummary, status_code=status.HTTP_201_CREATED)
def create_brand_kit(
    req: CreateBrandKitRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
) -> BrandKitSummary:
    """Create a new brand kit in the active workspace (Manager/Admin only)."""
    repo = BrandRepository(db, ctx.workspace_id)
    kit = repo.create_brand_kit(req.model_dump())
    return _format_brand_kit(kit)


@router.get("/samples/drafts")
def get_sample_drafts(
    ctx: WorkspaceContext = Depends(get_workspace_context),
) -> list[dict[str, Any]]:
    """Retrieve pre-seeded sample drafts for one-click testing in Demo workspace."""
    sample_path = Path(__file__).parent.parent / "seed" / "sample_drafts.json"
    if sample_path.exists():
        with open(sample_path, encoding="utf-8") as f:
            return json.load(f)
    return []


@router.get("/{kit_id}", response_model=BrandKitSummary)
def get_brand_kit(
    kit_id: str,
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
) -> BrandKitSummary:
    """Get single brand kit details within active workspace."""
    repo = BrandRepository(db, ctx.workspace_id)
    kit = repo.get_brand_kit(kit_id)
    if not kit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"Brand kit '{kit_id}' not found in workspace"}},
        )
    return _format_brand_kit(kit)


@router.put("/{kit_id}", response_model=BrandKitSummary)
@router.patch("/{kit_id}", response_model=BrandKitSummary)
def update_brand_kit(
    kit_id: str,
    req: UpdateBrandKitRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
) -> BrandKitSummary:
    """Update brand kit details (Manager/Admin only)."""
    repo = BrandRepository(db, ctx.workspace_id)
    kit = repo.update_brand_kit(kit_id, req.model_dump(exclude_unset=True))
    if not kit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Brand kit '{kit_id}' not found")
    return _format_brand_kit(kit)


@router.post("/{kit_id}/rules", response_model=RuleItem, status_code=status.HTTP_201_CREATED)
def add_rule(
    kit_id: str,
    req: CreateRuleRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
) -> RuleItem:
    """Add a new rule to a brand kit (Manager/Admin only)."""
    repo = BrandRepository(db, ctx.workspace_id)
    kit = repo.get_brand_kit(kit_id)
    if not kit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Brand kit '{kit_id}' not found")

    rule = repo.create_rule(kit_id, req.model_dump())
    return RuleItem(
        id=rule.id,
        kit_id=rule.kit_id,
        category=rule.category,
        title=rule.title,
        text=rule.text,
        banned_terms=rule.banned_terms,
        severity=rule.severity,
        version=rule.version,
        status=rule.status,
        effective_from=rule.effective_from,
        owner=rule.owner,
        source=rule.source,
    )


@router.put("/{kit_id}/rules/{rule_id}", response_model=RuleItem)
@router.patch("/{kit_id}/rules/{rule_id}", response_model=RuleItem)
def update_rule(
    kit_id: str,
    rule_id: str,
    req: UpdateRuleRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
) -> RuleItem:
    """Update an existing rule in a brand kit (Manager/Admin only)."""
    repo = BrandRepository(db, ctx.workspace_id)
    rule = repo.update_rule(rule_id, req.model_dump(exclude_unset=True))
    if not rule or rule.kit_id != kit_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Rule '{rule_id}' not found")

    return RuleItem(
        id=rule.id,
        kit_id=rule.kit_id,
        category=rule.category,
        title=rule.title,
        text=rule.text,
        banned_terms=rule.banned_terms,
        severity=rule.severity,
        version=rule.version,
        status=rule.status,
        effective_from=rule.effective_from,
        owner=rule.owner,
        source=rule.source,
    )


@router.post("/{kit_id}/facts", response_model=FactItem, status_code=status.HTTP_201_CREATED)
def add_fact(
    kit_id: str,
    req: CreateFactRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
) -> FactItem:
    """Add a fact to the facts register (Manager/Admin only)."""
    repo = BrandRepository(db, ctx.workspace_id)
    kit = repo.get_brand_kit(kit_id)
    if not kit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Brand kit '{kit_id}' not found")

    fact = repo.create_fact(kit_id, req.model_dump())
    return FactItem(
        id=fact.id,
        kit_id=fact.kit_id,
        subject=fact.subject,
        value=fact.value,
        unit=fact.unit,
        valid_from=fact.valid_from,
        valid_to=fact.valid_to,
        permitted_wording=fact.permitted_wording,
        owner=fact.owner,
        source=fact.source,
        status=fact.status,
    )


@router.put("/{kit_id}/facts/{fact_id}", response_model=FactItem)
@router.patch("/{kit_id}/facts/{fact_id}", response_model=FactItem)
def update_fact(
    kit_id: str,
    fact_id: str,
    req: UpdateFactRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
) -> FactItem:
    """Update a fact in the facts register (Manager/Admin only)."""
    repo = BrandRepository(db, ctx.workspace_id)
    fact = repo.update_fact(fact_id, req.model_dump(exclude_unset=True))
    if not fact or fact.kit_id != kit_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fact '{fact_id}' not found")

    return FactItem(
        id=fact.id,
        kit_id=fact.kit_id,
        subject=fact.subject,
        value=fact.value,
        unit=fact.unit,
        valid_from=fact.valid_from,
        valid_to=fact.valid_to,
        permitted_wording=fact.permitted_wording,
        owner=fact.owner,
        source=fact.source,
        status=fact.status,
    )


@router.post("/{kit_id}/claims", status_code=status.HTTP_201_CREATED)
def add_claim_pattern(
    kit_id: str,
    req: CreateClaimPatternRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
):
    """Add a claim pattern policy (Manager/Admin only)."""
    repo = BrandRepository(db, ctx.workspace_id)
    claim = repo.create_claim_pattern(kit_id, req.model_dump())
    return {"id": claim.id, "pattern": claim.pattern, "severity": claim.severity, "reason": claim.reason}


@router.get("/{kit_id}/claims")
def list_claim_patterns(
    kit_id: str,
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """List restricted claim patterns for a brand kit."""
    repo = BrandRepository(db, ctx.workspace_id)
    claims = repo.get_claims_for_kit(kit_id)
    return [
        {
            "id": c.id,
            "pattern": c.pattern,
            "category": c.category,
            "severity": c.severity,
            "substantiating_fact_id": c.substantiating_fact_id,
            "reason": c.reason,
            "status": c.status,
        }
        for c in claims
    ]


@router.post("/{kit_id}/glossary", status_code=status.HTTP_201_CREATED)
def add_glossary_term(
    kit_id: str,
    req: CreateGlossaryTermRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
):
    """Add an approved casing and brand glossary term."""
    repo = BrandRepository(db, ctx.workspace_id)
    term = repo.create_glossary_term(kit_id, req.model_dump())
    return {"id": term.id, "term": term.term, "preferred_casing": term.preferred_casing}


@router.get("/{kit_id}/glossary")
def list_glossary_terms(
    kit_id: str,
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """List glossary and typography terms."""
    repo = BrandRepository(db, ctx.workspace_id)
    terms = repo.get_glossary_for_kit(kit_id)
    return [{"id": t.id, "term": t.term, "preferred_casing": t.preferred_casing, "definition": t.definition} for t in terms]


@router.get("/{kit_id}/export")
def export_brand_kit(
    kit_id: str,
    format: str = Query(default="json", pattern="^(json|csv)$"),
    ctx: WorkspaceContext = Depends(get_workspace_context),
    db: Session = Depends(get_db),
):
    """Export complete brand kit definitions, rules, facts, claims, and glossary as JSON or CSV."""
    repo = BrandRepository(db, ctx.workspace_id)
    kit = repo.get_brand_kit(kit_id)
    if not kit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Brand kit '{kit_id}' not found")

    rules = repo.get_rules_for_kit(kit_id)
    facts = repo.get_facts_for_kit(kit_id)
    claims = repo.get_claims_for_kit(kit_id)
    glossary = repo.get_glossary_for_kit(kit_id)

    if format == "json":
        data = {
            "brand_kit": {
                "id": kit.id,
                "name": kit.name,
                "industry": kit.industry,
                "primary_language": kit.primary_language,
                "voice_tone": kit.voice_tone,
                "target_reading_level": kit.target_reading_level,
            },
            "rules": [
                {
                    "id": r.id,
                    "category": r.category,
                    "title": r.title,
                    "text": r.text,
                    "banned_terms": r.banned_terms,
                    "preferred_replacement": r.preferred_replacement,
                    "severity": r.severity,
                    "status": r.status,
                }
                for r in rules
            ],
            "facts": [
                {
                    "id": f.id,
                    "subject": f.subject,
                    "value": f.value,
                    "unit": f.unit,
                    "aliases": f.aliases,
                    "permitted_wording": f.permitted_wording,
                }
                for f in facts
            ],
            "claims": [{"pattern": c.pattern, "severity": c.severity, "reason": c.reason} for c in claims],
            "glossary": [{"term": g.term, "preferred_casing": g.preferred_casing} for g in glossary],
        }
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={kit.name.lower().replace(' ', '_')}_kit.json"},
        )

    # Format == csv
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Type", "ID", "Category", "Title/Subject", "Detail/Text", "Severity/Value", "Replacement/Unit"])

    for r in rules:
        writer.writerow(["Rule", r.id, r.category, r.title, r.text, r.severity, r.preferred_replacement or ""])
    for f in facts:
        writer.writerow(["Fact", f.id, "Facts Register", f.subject, f.permitted_wording, f.value, f.unit])
    for c in claims:
        writer.writerow(["Claim", c.id, "Claims Policy", c.pattern, c.reason, c.severity, ""])
    for g in glossary:
        writer.writerow(["Glossary", g.id, "Glossary", g.term, g.definition or "", g.preferred_casing, ""])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={kit.name.lower().replace(' ', '_')}_kit.csv"},
    )


@router.post("/{kit_id}/import", status_code=status.HTTP_201_CREATED)
def bulk_import_rules(
    kit_id: str,
    req: BulkImportRulesRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
):
    """Bulk import validated rules into the brand kit."""
    repo = BrandRepository(db, ctx.workspace_id)
    kit = repo.get_brand_kit(kit_id)
    if not kit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Brand kit '{kit_id}' not found")

    imported_rules = []
    for item in req.items:
        rule_data = {
            "category": item.category,
            "title": item.title,
            "text": item.text,
            "banned_terms": item.banned_terms,
            "preferred_replacement": item.preferred_replacement,
            "severity": item.severity,
            "owner": "Bulk Import",
            "source": "Imported Rules",
            "effective_from": "2026-01-01",
        }
        r = repo.create_rule(kit_id, rule_data)
        imported_rules.append(r.id)

    return {"message": f"Successfully imported {len(imported_rules)} entries", "rule_ids": imported_rules}


@router.post("/{kit_id}/extract-guideline")
def extract_guideline_rules(
    kit_id: str,
    req: GuidelineExtractRequest,
    ctx: WorkspaceContext = Depends(require_role("Admin", "Brand manager")),
    db: Session = Depends(get_db),
):
    """Heuristically extract atomic draft rules from guideline document text."""
    lines = [line.strip() for line in req.content.split("\n") if line.strip()]
    proposed: list[dict[str, Any]] = []

    for line in lines:
        lower = line.lower()
        # Heuristic 1: Negative / banned terminology
        if any(w in lower for w in ["never use", "do not use", "don't use", "avoid", "must not use", "banned"]):
            # Extract phrase after trigger if possible
            match = re.search(r"(?:never use|do not use|don't use|avoid|must not use|banned)\s+[\"']?([a-zA-Z0-9\s\-_]+)[\"']?", line, re.I)
            banned = [match.group(1).strip()] if match else []
            proposed.append({
                "type": "rule",
                "category": "Terminology",
                "title": f"Avoid {banned[0] if banned else 'prohibited term'}",
                "text": line,
                "banned_terms": banned,
                "preferred_replacement": None,
                "severity": "Major",
                "source": "Proposed by AI / Guideline Extractor",
            })
        # Heuristic 2: Mandatory lines or disclaimers
        elif any(w in lower for w in ["must include", "always include", "mandatory disclaimer", "required notice"]):
            proposed.append({
                "type": "rule",
                "category": "Messaging",
                "title": "Mandatory Messaging Line",
                "text": line,
                "banned_terms": [],
                "preferred_replacement": line,
                "severity": "Blocker",
                "source": "Proposed by AI / Guideline Extractor",
            })
        # Heuristic 3: Product casing or naming
        elif "spelled as" in lower or "capitalized as" in lower or "casing" in lower:
            proposed.append({
                "type": "rule",
                "category": "Terminology",
                "title": "Brand Terminology & Casing",
                "text": line,
                "banned_terms": [],
                "preferred_replacement": None,
                "severity": "Minor",
                "source": "Proposed by AI / Guideline Extractor",
            })

    return {
        "kit_id": kit_id,
        "extracted_count": len(proposed),
        "proposed_items": proposed[:20],
    }
