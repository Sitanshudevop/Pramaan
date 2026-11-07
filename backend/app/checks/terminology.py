"""Pure generic terminology check: banned terms, glossary casing, and spelling conventions."""

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
    "defense": "defence",
    "license": "licence",
}

EN_US_SPELLINGS: dict[str, str] = {v: k for k, v in EN_IN_SPELLINGS.items()}


def check_terminology(ctx: CheckContext) -> list[Finding]:
    """Inspect text for banned terms, casing errors, and spelling violations from user rules."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    # 1. Banned and deprecated terms from active rules
    for rule in ctx.rules:
        if rule.get("status") != "active":
            continue

        category = rule.get("category", "")
        if category not in ("Terminology", "Brand terms", "Guidelines"):
            continue

        banned_terms = rule.get("banned_terms") or []
        rule_id = rule.get("id", "TERM-000")
        rule_title = rule.get("title", "Terminology Rule")
        rule_severity = Severity(rule.get("severity", "Major"))
        replacement = rule.get("preferred_replacement")
        if not replacement:
            use_match = re.search(r"Use '([^']+)'", rule.get("text", ""))
            if use_match:
                replacement = use_match.group(1)

        allow_quotes = rule.get("allow_in_quotes", False)

        # Check explicit banned terms
        for term in banned_terms:
            if not term.strip():
                continue
            pattern = re.compile(rf"(?<!\w){re.escape(term.strip())}(?!\w)", re.IGNORECASE)
            for match in pattern.finditer(text):
                start, end = match.span()
                matched_text = match.group(0)

                # Skip if allow_in_quotes is enabled and term is inside quotes
                if allow_quotes:
                    left_char = text[start - 1] if start > 0 else ""
                    right_char = text[end] if end < len(text) else ""
                    if left_char in ('"', "'", "“") and right_char in ('"', "'", "”"):
                        continue

                is_approved = bool(replacement)
                suggestion = replacement if is_approved else "Remove or rewrite this phrase"

                purpose_preserved = is_approved
                if suggestion and is_approved:
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
                        source_version=rule.get("version", ctx.kit_snapshot_version),
                        reason=f"The term '{matched_text}' violates brand policy '{rule_title}': {rule.get('text', '')}",
                        suggestion=suggestion,
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True,
                            rule_passed=is_approved,
                            purpose_preserved=purpose_preserved,
                            note=None
                            if is_approved
                            else "No pre-approved replacement configured; human rewrite required.",
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

        # If rule specifies casing / never violations without explicit banned_terms:
        if not banned_terms:
            rule_text = rule.get("text", "")
            never_match = re.search(r"never\s+(['\"].*?)$", rule_text, re.IGNORECASE)
            if never_match:
                quoted_all = re.findall(r"['\"](.*?)['\"]", rule_text)
                avoid_phrases = re.findall(r"['\"](.*?)['\"]", never_match.group(1))
                preferred_form = quoted_all[0] if quoted_all else None
                for avoid in avoid_phrases:
                    for match in re.finditer(rf"\b{re.escape(avoid)}\b", text, re.IGNORECASE):
                        s, e = match.span()
                        matched_val = match.group(0)
                        findings.append(
                            Finding(
                                id=f"find-term-{ctx.review_id}-v{ctx.version}-{rule_id.lower()}-{s}",
                                review_id=ctx.review_id,
                                version=ctx.version,
                                category="Terminology",
                                severity=rule_severity,
                                status=FindingStatus.CONTRADICTED,
                                method=CheckMethod.DETERMINISTIC,
                                confidence=1.0,
                                excerpt=matched_val,
                                start=s,
                                end=e,
                                rule_id=rule_id,
                                fact_id=None,
                                source_title=rule_title,
                                source_version=rule.get("version", ctx.kit_snapshot_version),
                                reason=f"Brand term format violation: '{matched_val}' violates policy '{rule_title}': {rule_text}",
                                suggestion=preferred_form or "Use correct brand casing",
                                suggestion_check=SuggestionCheck(
                                    rule_rechecked=True, rule_passed=True, purpose_preserved=True
                                ),
                                decision=None,
                                created_at=now,
                            )
                        )

            title_case_match = re.search(
                r"write\s+['\"](.*?)['\"]\s+in\s+Title\s+Case", rule_text, re.IGNORECASE
            )
            if title_case_match:
                tc_term = title_case_match.group(1)
                for match in re.finditer(rf"\b{re.escape(tc_term)}\b", text, re.IGNORECASE):
                    s, e = match.span()
                    matched_val = match.group(0)
                    if matched_val != tc_term:
                        findings.append(
                            Finding(
                                id=f"find-term-{ctx.review_id}-v{ctx.version}-{rule_id.lower()}-{s}",
                                review_id=ctx.review_id,
                                version=ctx.version,
                                category="Terminology",
                                severity=rule_severity,
                                status=FindingStatus.CONTRADICTED,
                                method=CheckMethod.DETERMINISTIC,
                                confidence=1.0,
                                excerpt=matched_val,
                                start=s,
                                end=e,
                                rule_id=rule_id,
                                fact_id=None,
                                source_title=rule_title,
                                source_version=rule.get("version", ctx.kit_snapshot_version),
                                reason=f"Product name casing error: '{matched_val}' must be Title Case: '{tc_term}'.",
                                suggestion=tc_term,
                                suggestion_check=SuggestionCheck(
                                    rule_rechecked=True, rule_passed=True, purpose_preserved=True
                                ),
                                decision=None,
                                created_at=now,
                            )
                        )

    # 2. Glossary & Brand Term Casing Checks
    for term_entry in ctx.glossary_terms:
        term = term_entry.get("term", "").strip()
        preferred_casing = term_entry.get("preferred_casing", "").strip()
        if not term or not preferred_casing:
            continue

        pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
        for match in pattern.finditer(text):
            start, end = match.span()
            matched = match.group(0)
            if matched != preferred_casing:
                findings.append(
                    Finding(
                        id=f"find-glossary-{ctx.review_id}-v{ctx.version}-{start}",
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
                        rule_id=term_entry.get("id", "GLOSSARY"),
                        fact_id=None,
                        source_title=f"Brand Glossary: {preferred_casing}",
                        source_version=ctx.kit_snapshot_version,
                        reason=f"Brand term casing violation: '{matched}' must be written as '{preferred_casing}'.",
                        suggestion=preferred_casing,
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True, rule_passed=True, purpose_preserved=True
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

    # 3. Primary Language Spelling Conventions (en-IN vs en-US)
    spelling_rule = next(
        (
            r
            for r in ctx.rules
            if "spell" in r.get("title", "").lower()
            or "en-in" in r.get("title", "").lower()
            or r.get("id") == "TERM-003"
        ),
        None,
    )
    spelling_rule_id = spelling_rule.get("id", "SPELL-001") if spelling_rule else "SPELL-001"
    spelling_source_title = (
        spelling_rule.get("title", f"Spelling convention ({ctx.primary_language})")
        if spelling_rule
        else f"Spelling convention ({ctx.primary_language})"
    )
    spelling_severity = (
        Severity(spelling_rule.get("severity", "Minor")) if spelling_rule else Severity.MINOR
    )

    spelling_dict = (
        EN_IN_SPELLINGS
        if "IN" in ctx.primary_language or "GB" in ctx.primary_language
        else EN_US_SPELLINGS
    )
    for bad_spelling, correct_spelling in spelling_dict.items():
        pattern = re.compile(rf"\b{re.escape(bad_spelling)}\b", re.IGNORECASE)
        for match in pattern.finditer(text):
            start, end = match.span()
            matched = match.group(0)
            findings.append(
                Finding(
                    id=f"find-spell-{ctx.review_id}-v{ctx.version}-{start}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Terminology",
                    severity=spelling_severity,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt=matched,
                    start=start,
                    end=end,
                    rule_id=spelling_rule_id,
                    fact_id=None,
                    source_title=spelling_source_title,
                    source_version=ctx.kit_snapshot_version,
                    reason=f"Spelling '{matched}' does not conform to '{spelling_source_title}'. Use '{correct_spelling}'.",
                    suggestion=correct_spelling
                    if matched.islower()
                    else correct_spelling.capitalize(),
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    return findings
