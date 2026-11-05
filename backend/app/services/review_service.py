"""Review pipeline service orchestrating normalisation, retrieval, checks, AI, and persistence."""

from app.ai.bm25 import GuidelineRetriever
from app.ai.gemini import GeminiProvider
from app.ai.null_provider import NullProvider
from app.ai.provider import AIProvider
from app.ai.verifier import verify_ai_findings
from app.checks.context import CheckContext
from app.checks.runner import run_deterministic_checks
from app.config import settings
from app.constants import Role
from app.models.entities import ReviewModel
from app.repositories.audit_repo import AuditRepository
from app.repositories.brand_repo import BrandRepository
from app.repositories.review_repo import ReviewRepository
from app.schemas.schemas import CreateReviewRequest, Finding
from sqlalchemy.orm import Session


class ReviewService:
    """Core review orchestration executing the complete pre-publication compliance loop."""

    def __init__(self, db: Session, ai_provider: AIProvider | None = None):
        self.db = db
        self.brand_repo = BrandRepository(db)
        self.review_repo = ReviewRepository(db)
        self.audit_repo = AuditRepository(db)

        # Configure AI provider or fallback
        if ai_provider:
            self.ai_provider = ai_provider
        elif settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            self.ai_provider = GeminiProvider()
        else:
            self.ai_provider = NullProvider()

    async def execute_review(
        self,
        request: CreateReviewRequest,
        actor_role: Role,
        confidential_mode: bool = False,
    ) -> ReviewModel:
        """Run the end-to-end review pipeline and persist findings and audit ledger entries."""
        kit = self.brand_repo.get_brand_kit(request.brand_kit_id)
        if not kit:
            raise ValueError(f"Brand kit '{request.brand_kit_id}' not found")

        # 1. Fetch active rules and facts as dicts
        rules_data = [
            {
                "id": r.id,
                "kit_id": r.kit_id,
                "category": r.category,
                "title": r.title,
                "text": r.text,
                "banned_terms": r.banned_terms,
                "severity": r.severity,
                "version": r.version,
                "status": r.status,
                "effective_from": r.effective_from,
                "owner": r.owner,
                "source": r.source,
            }
            for r in kit.rules
        ]
        facts_data = [
            {
                "id": f.id,
                "kit_id": f.kit_id,
                "subject": f.subject,
                "value": f.value,
                "unit": f.unit,
                "valid_from": f.valid_from,
                "valid_to": f.valid_to,
                "permitted_wording": f.permitted_wording,
                "owner": f.owner,
                "source": f.source,
                "status": f.status,
            }
            for f in kit.facts
        ]

        # 2. Persist Review and Initial Version
        review = self.review_repo.create_review(
            kit_id=kit.id,
            content=request.content,
            content_type=request.content_type,
            purpose_card=request.purpose_card,
            ai_declared=request.ai_declared,
            created_by_role=actor_role,
        )

        # 3. Deterministic check layer (pure, reproducible)
        ctx = CheckContext(
            text=request.content,
            rules=rules_data,
            facts=facts_data,
            purpose_card=request.purpose_card,
            review_id=review.id,
            version=1,
            content_type=request.content_type,
            ai_declared=request.ai_declared,
            brand_kit_id=kit.id,
            target_reading_level=kit.target_reading_level,
        )
        deterministic_findings = run_deterministic_checks(ctx)

        # 4. BM25 Retrieval over active approved assets
        retriever = GuidelineRetriever(rules_data, facts_data)
        retrieved_docs = retriever.retrieve(request.content, top_k=6)
        retrieved_rules = [d["item"] for d in retrieved_docs if d["type"] == "rule"]
        retrieved_facts = [d["item"] for d in retrieved_docs if d["type"] == "fact"]

        # 5. AI Layer (Optional, bypassed in Confidential Mode)
        verified_ai_findings: list[Finding] = []
        if not confidential_mode and not isinstance(self.ai_provider, NullProvider):
            ai_res = await self.ai_provider.evaluate_content(
                passage=request.content,
                retrieved_rules=retrieved_rules,
                retrieved_facts=retrieved_facts,
                purpose_card=request.purpose_card,
            )
            # Code-based verification guard
            verified_ai_findings = verify_ai_findings(
                raw_findings=ai_res.findings,
                content=request.content,
                rules=rules_data,
                facts=facts_data,
                purpose_card=request.purpose_card,
                review_id=review.id,
                version=1,
            )

            # Record AI disclosure ledger
            self.audit_repo.append_disclosure(
                review_id=review.id,
                provider=ai_res.provider_name,
                model=ai_res.model,
                data_class="Confidential (Redacted Draft Passage)",
                pii_redacted=True,
                token_count=ai_res.tokens_used,
            )

        # 6. Combine and de-duplicate findings
        final_findings: list[Finding] = []
        seen_ids: set[str] = set()

        for df in deterministic_findings:
            f_id = df.id
            if f_id in seen_ids:
                f_id = f"{f_id}-{len(seen_ids)}"
                df.id = f_id
            seen_ids.add(f_id)
            final_findings.append(df)

        for af in verified_ai_findings:
            f_id = af.id
            if f_id in seen_ids:
                f_id = f"{f_id}-{len(seen_ids)}"
                af.id = f_id
            seen_ids.add(f_id)
            final_findings.append(af)

        # Persist findings
        self.review_repo.save_findings(final_findings)

        # 7. Append-only Audit Trail
        self.audit_repo.append_audit_event(
            actor_role=actor_role,
            action="review_created",
            entity="review",
            entity_id=review.id,
            detail={
                "brand_kit_id": kit.id,
                "content_length": len(request.content),
                "findings_count": len(final_findings),
                "confidential_mode": confidential_mode,
            },
        )

        # Refresh review with all newly associated relations
        self.db.refresh(review)
        return review
