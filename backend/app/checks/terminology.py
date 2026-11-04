"""Pure terminology check: banned terms, product name casing, and en-IN spelling."""

import re
from datetime import UTC, datetime

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck

EN_IN_SPELLINGS: dict[str, str] = {
    "flavor": "flavour",
    "flavors": "flavours",
    "color": "colour",
    "colors": "colours",
    "organize": "organise",
    "organizes": "organises",
    "organizing": "organising",
    "center": "centre",
    "meter": "metre",
}


def check_terminology(ctx: CheckContext) -> list[Finding]:
    """Inspect text for banned terms, casing errors, and en-IN spelling violations."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    # 1. Banned and deprecated terms from active rules
    for rule in ctx.rules:
        if rule.get("status") != "active":
            continue

        banned_terms = rule.get("banned_terms") or []
        rule_id = rule.get("id", "")
        rule_title = rule.get("title", "Terminology Rule")
        rule_severity = Severity(rule.get("severity", "Major"))

        for term in banned_terms:
            pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
            for match in pattern.finditer(text):
                start, end = match.span()
                matched_text = match.group(0)

                suggestion = None
                if matched_text.lower() == "cheap":
                    suggestion = "accessible value"
                elif matched_text.lower() == "guaranteed":
                    suggestion = "carefully crafted"
                elif matched_text.lower() == "miracle":
                    suggestion = "cherished"
                elif matched_text.lower() == "leafsave" or matched_text.lower() in (
                    "ledger leaf+",
                    "ledgerleaf+",
                ):
                    suggestion = "LedgerLeaf Plus"
                elif matched_text.lower() == "risk-free":
                    suggestion = "disciplined"
                elif matched_text.lower() == "zero fees":
                    suggestion = "transparent, competitive pricing"

                purpose_preserved = True
                if suggestion:
                    for locked in ctx.purpose_card.locked_phrases:
                        if (
                            locked.lower() in matched_text.lower()
                            and locked.lower() not in suggestion.lower()
                        ):
                            purpose_preserved = False

                finding_id = f"find-term-{ctx.review_id}-v{ctx.version}-{rule_id.lower()}-{start}"
                findings.append(
                    Finding(
                        id=finding_id,
                        review_id=ctx.review_id,
                        version=ctx.version,
                        category="Terminology",
                        severity=rule_severity,
                        status=FindingStatus.CONTRADICTED,
                        method=CheckMethod.DETERMINISTIC,
                        confidence=1.0,
                        excerpt=matched_text,
                        start=start,
                        end=end,
                        rule_id=rule_id,
                        fact_id=None,
                        source_title=rule_title,
                        source_version=rule.get("version", "1.0"),
                        reason=f"The term '{matched_text}' violates policy rule {rule_id}: {rule.get('text', '')}",
                        suggestion=suggestion,
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True,
                            rule_passed=True,
                            purpose_preserved=purpose_preserved,
                            note=None
                            if purpose_preserved
                            else "Suggestion alters a locked phrase; human review required.",
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

    # 2. Product Name Casing & Ampersand Check (TERM-002)
    if ctx.brand_kit_id == "kettle-and-co":
        kettle_pattern = re.compile(
            r"\b(kettle\s+and\s+co\.?|kettle\s+&\s+company)\b", re.IGNORECASE
        )
        for match in kettle_pattern.finditer(text):
            start, end = match.span()
            matched = match.group(0)
            if matched != "Kettle & Co.":
                findings.append(
                    Finding(
                        id=f"find-term-002-{ctx.review_id}-v{ctx.version}-{start}",
                        review_id=ctx.review_id,
                        version=ctx.version,
                        category="Terminology",
                        severity=Severity.MAJOR,
                        status=FindingStatus.CONTRADICTED,
                        method=CheckMethod.DETERMINISTIC,
                        confidence=1.0,
                        excerpt=matched,
                        start=start,
                        end=end,
                        rule_id="TERM-002",
                        fact_id=None,
                        source_title="Product name casing & typography",
                        source_version="1.0",
                        reason="Brand name must be written with an ampersand: 'Kettle & Co.'",
                        suggestion="Kettle & Co.",
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True, rule_passed=True, purpose_preserved=True
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

        masala_pattern = re.compile(r"\b(masala\s+chai)\b")
        for match in masala_pattern.finditer(text):
            start, end = match.span()
            matched = match.group(0)
            findings.append(
                Finding(
                    id=f"find-term-002-chai-{ctx.review_id}-v{ctx.version}-{start}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Terminology",
                    severity=Severity.MAJOR,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt=matched,
                    start=start,
                    end=end,
                    rule_id="TERM-002",
                    fact_id=None,
                    source_title="Product name casing & typography",
                    source_version="1.0",
                    reason="Product name must be Title Case: 'Masala Chai'.",
                    suggestion="Masala Chai",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    # 3. en-IN Spelling Check (TERM-003)
    if ctx.brand_kit_id == "kettle-and-co":
        for us_word, en_in_word in EN_IN_SPELLINGS.items():
            pattern = re.compile(rf"\b{re.escape(us_word)}\b", re.IGNORECASE)
            for match in pattern.finditer(text):
                start, end = match.span()
                matched = match.group(0)
                findings.append(
                    Finding(
                        id=f"find-term-003-{ctx.review_id}-v{ctx.version}-{start}",
                        review_id=ctx.review_id,
                        version=ctx.version,
                        category="Terminology",
                        severity=Severity.MINOR,
                        status=FindingStatus.CONTRADICTED,
                        method=CheckMethod.DETERMINISTIC,
                        confidence=1.0,
                        excerpt=matched,
                        start=start,
                        end=end,
                        rule_id="TERM-003",
                        fact_id=None,
                        source_title="Indian English (en-IN) spelling conventions",
                        source_version="1.0",
                        reason=f"American English spelling '{matched}' detected. Use Indian English '{en_in_word}'.",
                        suggestion=en_in_word if matched.islower() else en_in_word.capitalize(),
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True, rule_passed=True, purpose_preserved=True
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

    return findings
