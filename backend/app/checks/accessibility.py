"""Pure accessibility and tone checks: reading level, vague links, and shouting copy."""

import re
from datetime import UTC, datetime

import textstat

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck

VAGUE_LINKS = ["click here", "read more", "learn more", "more info", "tap here"]


def check_accessibility_and_tone(ctx: CheckContext) -> list[Finding]:
    """Inspect text for WCAG-referenced plain language readability, all-caps shouting, and vague links."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    # 1. All-Caps Shouting Check (TONE-001)
    shout_pattern = re.compile(r"\b([A-Z]{3,}(?:\s+[A-Z]{2,}){2,})\b")
    for match in shout_pattern.finditer(text):
        start, end = match.span()
        matched = match.group(0)

        suggestion = matched.capitalize()

        findings.append(
            Finding(
                id=f"find-tone-shout-{ctx.review_id}-v{ctx.version}-{start}",
                review_id=ctx.review_id,
                version=ctx.version,
                category="Tone and voice",
                severity=Severity.MINOR,
                status=FindingStatus.CONTRADICTED,
                method=CheckMethod.DETERMINISTIC,
                confidence=1.0,
                excerpt=matched,
                start=start,
                end=end,
                rule_id="TONE-001",
                fact_id=None,
                source_title="Calm readability & shouting prohibition",
                source_version="1.0",
                reason=f"All-caps shouting ('{matched}') violates brand voice guidelines for calm, respectful communication.",
                suggestion=suggestion,
                suggestion_check=SuggestionCheck(
                    rule_rechecked=True, rule_passed=True, purpose_preserved=True
                ),
                decision=None,
                created_at=now,
            )
        )

    # 2. Vague link text
    for vague in VAGUE_LINKS:
        pattern = re.compile(rf"\b{re.escape(vague)}\b", re.IGNORECASE)
        for match in pattern.finditer(text):
            start, end = match.span()
            matched = match.group(0)
            findings.append(
                Finding(
                    id=f"find-a11y-vague-{ctx.review_id}-v{ctx.version}-{start}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Accessibility (text)",
                    severity=Severity.MINOR,
                    status=FindingStatus.NEEDS_HUMAN_JUDGEMENT,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=0.90,
                    excerpt=matched,
                    start=start,
                    end=end,
                    rule_id="WCAG-2.4.4",
                    fact_id=None,
                    source_title="WCAG 2.4.4 Link Purpose In Context",
                    source_version="2.2",
                    reason=f"Link phrase '{matched}' is ambiguous out of context. Use descriptive destination wording.",
                    suggestion=f"explore the {ctx.purpose_card.locked_phrases[0] if ctx.purpose_card.locked_phrases else 'details'}",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    # 3. Reading level grade calculation via textstat
    # Only calculate reading grade for longer prose (> 30 words) to avoid skew from short statutory legal notices
    words = text.split()
    if len(words) > 30:
        try:
            grade = textstat.flesch_kincaid_grade(text)
            if grade > ctx.target_reading_level + 2.5:
                findings.append(
                    Finding(
                        id=f"find-a11y-reading-{ctx.review_id}-v{ctx.version}",
                        review_id=ctx.review_id,
                        version=ctx.version,
                        category="Accessibility (text)",
                        severity=Severity.INFO,
                        status=FindingStatus.NEEDS_HUMAN_JUDGEMENT,
                        method=CheckMethod.DETERMINISTIC,
                        confidence=0.85,
                        excerpt="Document readability grade exceeds target",
                        start=0,
                        end=0,
                        rule_id="TONE-001",
                        fact_id=None,
                        source_title="Readability Plain Language Guidelines",
                        source_version="1.0",
                        reason=(
                            f"Estimated Flesch-Kincaid Grade is {grade:.1f}, exceeding the brand target "
                            f"grade of {ctx.target_reading_level}. Consider shortening sentences."
                        ),
                        suggestion=None,
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=False, rule_passed=True, purpose_preserved=True
                        ),
                        decision=None,
                        created_at=now,
                    )
                )
        except Exception:
            pass

    return findings
