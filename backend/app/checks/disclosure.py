"""Pure AI & sponsored content disclosure check."""

from datetime import UTC, datetime

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck


def check_disclosure(ctx: CheckContext) -> list[Finding]:
    """Verify that mandatory AI assistance or sponsorship disclosures are present."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    if ctx.ai_declared or ctx.purpose_card.ai_declared:
        required_ai_disclosure = "Created with AI assistance and reviewed by our team."
        if required_ai_disclosure.lower() not in text.lower():
            findings.append(
                Finding(
                    id=f"find-ai-001-{ctx.review_id}-v{ctx.version}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="AI and disclosure",
                    severity=Severity.MAJOR,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt=text[: min(len(text), 80)],
                    start=0,
                    end=min(len(text), 80),
                    rule_id="AI-001",
                    fact_id=None,
                    source_title="Mandatory AI content disclosure",
                    source_version="1.0",
                    reason="Creator declared AI assistance, but content lacks mandatory disclosure statement: 'Created with AI assistance and reviewed by our team.'",
                    suggestion=f"{text.rstrip()} {required_ai_disclosure}",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    return findings
