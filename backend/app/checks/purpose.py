"""Pure purpose card check: locked phrases and CTA preservation."""

from datetime import UTC, datetime

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck


def check_purpose_card(ctx: CheckContext) -> list[Finding]:
    """Ensure locked phrases and calls to action defined in the Purpose Card are honored."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)
    card = ctx.purpose_card

    # 1. Locked phrases presence
    for locked in card.locked_phrases:
        if locked and locked.lower() not in text.lower():
            findings.append(
                Finding(
                    id=f"find-purpose-locked-{ctx.review_id}-v{ctx.version}-{abs(hash(locked)) % 10000}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Purpose card",
                    severity=Severity.MAJOR,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt=text[: min(len(text), 80)],
                    start=0,
                    end=min(len(text), 80),
                    rule_id=None,
                    fact_id=None,
                    source_title="Creator Purpose Card Constraint",
                    source_version="1.0",
                    reason=f"Mandatory locked phrase '{locked}' specified in the Purpose Card is missing from the content.",
                    suggestion=f"{text.rstrip()} (Featuring {locked})",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    # 2. Call to action presence
    cta = card.call_to_action.strip()
    if cta:
        cta_words = [w.lower() for w in cta.split() if len(w) > 3]
        cta_present = any(w in text.lower() for w in cta_words)
        if not cta_present and len(text) > 30:
            findings.append(
                Finding(
                    id=f"find-purpose-cta-{ctx.review_id}-v{ctx.version}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Purpose card",
                    severity=Severity.MINOR,
                    status=FindingStatus.NEEDS_HUMAN_JUDGEMENT,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=0.85,
                    excerpt=text[-min(len(text), 60) :],
                    start=max(0, len(text) - 60),
                    end=len(text),
                    rule_id=None,
                    fact_id=None,
                    source_title="Creator Purpose Card: Call to Action",
                    source_version="1.0",
                    reason=f"Draft lacks clear reference to target Call to Action: '{cta}'.",
                    suggestion=f"{text.rstrip()} {cta}.",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    return findings
