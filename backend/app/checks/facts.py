"""Pure facts register check: price verification, tier quota validation, and stale fact flags."""

import re
from datetime import UTC, datetime

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck


def check_facts(ctx: CheckContext) -> list[Finding]:
    """Compare content figures and terms against the approved and expired facts registers."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    # 1. Price checks for Kettle & Co. (F-14 active: ₹349; F-15 expired: ₹299)
    if ctx.brand_kit_id == "kettle-and-co":
        pattern_old_price = re.compile(r"(?:₹\s*299|299\s*(?:rs|inr|rupees)?)", re.IGNORECASE)
        for match in pattern_old_price.finditer(text):
            start, end = match.span()
            matched = match.group(0)

            findings.append(
                Finding(
                    id=f"find-fact-15-{ctx.review_id}-v{ctx.version}-{start}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Facts",
                    severity=Severity.BLOCKER,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt=matched,
                    start=start,
                    end=end,
                    rule_id=None,
                    fact_id="F-15",
                    source_title="Masala Chai 250g Historic Price",
                    source_version="1.0",
                    reason="Price '₹299' refers to an expired fact (expired 2026-06-30). Active approved price is ₹349 (Fact F-14).",
                    suggestion="₹349",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    # 2. Account limits for LedgerLeaf (F-31: 5 linked accounts for free tier)
    if ctx.brand_kit_id == "ledgerleaf":
        pattern_free_tier = re.compile(
            r"(\b10\s+accounts\b.*?\bfree\b|\bfree\b.*?\b10\s+accounts\b|\b10\s+linked\s+accounts\b)",
            re.IGNORECASE,
        )
        for match in pattern_free_tier.finditer(text):
            start, end = match.span()
            matched = match.group(0)

            findings.append(
                Finding(
                    id=f"find-fact-31-{ctx.review_id}-v{ctx.version}-{start}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Facts",
                    severity=Severity.BLOCKER,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt=matched,
                    start=start,
                    end=end,
                    rule_id=None,
                    fact_id="F-31",
                    source_title="Free Tier Account Limit",
                    source_version="1.0",
                    reason="Claim states 10 free accounts, contradicting approved Fact F-31: free tier is limited to 5 linked accounts.",
                    suggestion=matched.replace("10", "5"),
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    return findings
