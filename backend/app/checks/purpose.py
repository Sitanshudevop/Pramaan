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
                    severity=Severity.MINOR,
                    status=FindingStatus.NEEDS_HUMAN_JUDGEMENT,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt="Locked phrase not found in the draft",
                    start=0,
                    end=0,
                    rule_id="PC-LOCKED-PHRASE",
                    fact_id=None,
                    source_title="Creator Purpose Card Constraint",
                    source_version="1.0",
                    reason=f"Mandatory locked phrase '{locked}' specified in the Purpose Card is missing from the draft.",
                    suggestion=None,
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True,
                        rule_passed=False,
                        purpose_preserved=False,
                        note="Review draft to include the locked phrase or adjust the Purpose Card.",
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    # 2. Call to action presence
    cta = card.call_to_action.strip()
    if cta:
        cta_words = [w.lower() for w in cta.split() if len(w) > 3]
        if not cta_words:
            cta_words = [w.lower() for w in cta.split() if len(w) > 0]
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
                    excerpt="Target CTA not found in the draft",
                    start=0,
                    end=0,
                    rule_id="PC-CTA",
                    fact_id=None,
                    source_title="Creator Purpose Card: Call to Action",
                    source_version="1.0",
                    reason=f"Draft lacks clear reference to target Call to Action: '{cta}'.",
                    suggestion=None,
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True,
                        rule_passed=False,
                        purpose_preserved=False,
                        note="Draft should include a call to action aligned with target CTA.",
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    return findings
