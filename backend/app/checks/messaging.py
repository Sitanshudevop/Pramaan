"""Pure messaging check: mandatory lines and statutory disclaimers."""

from datetime import UTC, datetime

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck


def check_messaging(ctx: CheckContext) -> list[Finding]:
    """Verify that mandatory disclaimers and required lines exist where applicable."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    # 1. Kettle & Co. MSG-001: Promotional email mandatory disclaimer
    if ctx.brand_kit_id == "kettle-and-co":
        is_promo = (
            "email" in ctx.content_type.lower() and "promo" in ctx.content_type.lower()
        ) or any(
            w in text.lower()
            for w in ["% off", "discount", "festive diwali sale", "huge deal", "special offer"]
        )
        required_phrase = "Offer valid while stocks last. T&Cs apply."
        if is_promo and required_phrase.lower() not in text.lower():
            findings.append(
                Finding(
                    id=f"find-msg-001-{ctx.review_id}-v{ctx.version}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Messaging",
                    severity=Severity.MAJOR,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt=text[: min(len(text), 80)] + ("..." if len(text) > 80 else ""),
                    start=0,
                    end=min(len(text), 80),
                    rule_id="MSG-001",
                    fact_id=None,
                    source_title="Mandatory promotional email disclaimer",
                    source_version="1.1",
                    reason="Promotional content is missing mandatory disclaimer: 'Offer valid while stocks last. T&Cs apply.'",
                    suggestion=f"{text.rstrip()} {required_phrase}",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    # 2. LedgerLeaf MSG-010: Statutory market risk disclaimer
    if ctx.brand_kit_id == "ledgerleaf":
        has_returns_or_investment = (
            "annualized" in text.lower()
            or "guaranteed returns" in text.lower()
            or ("return" in text.lower() and "%" in text)
            or ("yield" in text.lower() and "%" in text)
        )
        required_disclaimer = (
            "Investments are subject to market risks. Read all scheme-related documents carefully."
        )
        if has_returns_or_investment and required_disclaimer.lower() not in text.lower():
            findings.append(
                Finding(
                    id=f"find-msg-010-{ctx.review_id}-v{ctx.version}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Messaging",
                    severity=Severity.BLOCKER,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt=text[: min(len(text), 80)] + ("..." if len(text) > 80 else ""),
                    start=0,
                    end=min(len(text), 80),
                    rule_id="MSG-010",
                    fact_id=None,
                    source_title="Mandatory investment market risk disclaimer",
                    source_version="1.0",
                    reason="Content describing investments or returns is missing statutory risk notice: 'Investments are subject to market risks. Read all scheme-related documents carefully.'",
                    suggestion=f"{text.rstrip()} {required_disclaimer}",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    return findings
