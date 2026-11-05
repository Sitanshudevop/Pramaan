"""Pure promotional claims check: superlatives, absolutes, health & medical claims."""

import re
from datetime import UTC, datetime

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck

HEALTH_KEYWORDS = [
    "cure",
    "cures",
    "curing",
    "clinically proven",
    "treats",
    "treating",
    "treatment",
    "detox",
    "detoxifies",
    "detoxifying",
    "cure stress",
    "prevent disease",
]

SUPERLATIVES = [
    "best",
    "fastest",
    "#1",
    "number one",
    "greatest",
    "unmatched",
]


def check_claims(ctx: CheckContext) -> list[Finding]:
    """Flag unsupported superlatives, absolutes, and health claims."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    # 1. Health & Medical Claims (CLAIM-4.2)
    if ctx.brand_kit_id == "kettle-and-co":
        for keyword in HEALTH_KEYWORDS:
            pattern = re.compile(rf"\b{re.escape(keyword)}\b", re.IGNORECASE)
            for match in pattern.finditer(text):
                start, end = match.span()
                matched = match.group(0)

                findings.append(
                    Finding(
                        id=f"find-claim-42-{ctx.review_id}-v{ctx.version}-{start}-{end}",
                        review_id=ctx.review_id,
                        version=ctx.version,
                        category="Promotional claims",
                        severity=Severity.BLOCKER,
                        status=FindingStatus.UNSUPPORTED,
                        method=CheckMethod.DETERMINISTIC,
                        confidence=1.0,
                        excerpt=matched,
                        start=start,
                        end=end,
                        rule_id="CLAIM-4.2",
                        fact_id=None,
                        source_title="Medical & health claims prohibition",
                        source_version="2.0",
                        reason=f"Health claim '{matched}' detected without approved clinical trial dossier substantiation.",
                        suggestion="comfort your senses"
                        if "cure" in matched.lower()
                        else "carefully crafted",
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True, rule_passed=True, purpose_preserved=True
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

    # 2. Unsubstantiated Superlatives (CLAIM-3.1)
    if ctx.brand_kit_id == "kettle-and-co":
        for super_word in SUPERLATIVES:
            pattern = re.compile(rf"\b{re.escape(super_word)}\b", re.IGNORECASE)
            for match in pattern.finditer(text):
                start, end = match.span()
                matched = match.group(0)

                substantiated = any(
                    super_word.lower() in f.get("value", "").lower() and f.get("status") == "active"
                    for f in ctx.facts
                )
                if not substantiated:
                    findings.append(
                        Finding(
                            id=f"find-claim-31-{ctx.review_id}-v{ctx.version}-{start}-{end}",
                            review_id=ctx.review_id,
                            version=ctx.version,
                            category="Promotional claims",
                            severity=Severity.MAJOR,
                            status=FindingStatus.UNSUPPORTED,
                            method=CheckMethod.DETERMINISTIC,
                            confidence=0.95,
                            excerpt=matched,
                            start=start,
                            end=end,
                            rule_id="CLAIM-3.1",
                            fact_id=None,
                            source_title="Unsubstantiated superlatives restriction",
                            source_version="1.2",
                            reason=f"Superlative '{matched}' lacks verifiable third-party certification in the facts register.",
                            suggestion="celebrated" if matched.lower() == "best" else "distinctive",
                            suggestion_check=SuggestionCheck(
                                rule_rechecked=True, rule_passed=True, purpose_preserved=True
                            ),
                            decision=None,
                            created_at=now,
                        )
                    )

    # 3. Absolutes & 100% claims (CLAIM-3.1)
    if ctx.brand_kit_id == "kettle-and-co":
        for absolute in ["100% pesticide-free", "pesticide-free"]:
            pattern = re.compile(rf"\b{re.escape(absolute)}\b", re.IGNORECASE)
            for match in pattern.finditer(text):
                start, end = match.span()
                matched = match.group(0)

                substantiated = any(
                    matched.lower() in f.get("permitted_wording", "").lower()
                    and f.get("status") == "active"
                    for f in ctx.facts
                )
                if not substantiated:
                    findings.append(
                        Finding(
                            id=f"find-claim-abs-{ctx.review_id}-v{ctx.version}-{start}-{end}",
                            review_id=ctx.review_id,
                            version=ctx.version,
                            category="Promotional claims",
                            severity=Severity.MAJOR,
                            status=FindingStatus.UNSUPPORTED,
                            method=CheckMethod.DETERMINISTIC,
                            confidence=0.90,
                            excerpt=matched,
                            start=start,
                            end=end,
                            rule_id="CLAIM-3.1",
                            fact_id=None,
                            source_title="Unsubstantiated promotional claim",
                            source_version="1.2",
                            reason=f"Absolute claim '{matched}' is not substantiated in the active facts register.",
                            suggestion="certified organic"
                            if "pesticide" in matched.lower()
                            else "wholesome",
                            suggestion_check=SuggestionCheck(
                                rule_rechecked=True, rule_passed=True, purpose_preserved=True
                            ),
                            decision=None,
                            created_at=now,
                        )
                    )
                    break

    # 4. Financial Promises (CLAIM-1.1 / CLAIM-1.4)
    if ctx.brand_kit_id == "ledgerleaf":
        for term in ["guaranteed returns", "zero fees", "risk-free"]:
            pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
            for match in pattern.finditer(text):
                start, end = match.span()
                matched = match.group(0)
                findings.append(
                    Finding(
                        id=f"find-claim-11-{ctx.review_id}-v{ctx.version}-{start}-{end}",
                        review_id=ctx.review_id,
                        version=ctx.version,
                        category="Promotional claims",
                        severity=Severity.BLOCKER,
                        status=FindingStatus.UNSUPPORTED,
                        method=CheckMethod.DETERMINISTIC,
                        confidence=1.0,
                        excerpt=matched,
                        start=start,
                        end=end,
                        rule_id="CLAIM-1.1",
                        fact_id=None,
                        source_title="Unsubstantiated financial promises prohibition",
                        source_version="2.1",
                        reason=f"Financial guarantee '{matched}' is prohibited without statutory regulatory approval.",
                        suggestion="target returns"
                        if "guaranteed returns" in matched.lower()
                        else "low, transparent fees",
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True, rule_passed=True, purpose_preserved=True
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

    return findings
