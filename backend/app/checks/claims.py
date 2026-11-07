"""Pure generic claims check: restricted patterns and substantiating fact verification."""

import re
from datetime import UTC, datetime

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck


def check_claims(ctx: CheckContext) -> list[Finding]:
    """Flag unsupported promotional claims, superlatives, and user-defined claim patterns."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    # 1. Evaluate User-Defined Claim Patterns
    for claim in ctx.claim_patterns:
        if claim.get("status") != "active":
            continue

        raw_pattern = claim.get("pattern", "").strip()
        if not raw_pattern:
            continue

        pattern_id = claim.get("id", "CLM-000")
        severity_val = Severity(claim.get("severity", "Major"))
        reason_text = claim.get("reason", "Restricted claim requires verifiable substantiation.")
        fact_id = claim.get("substantiating_fact_id")

        regex = re.compile(rf"\b{re.escape(raw_pattern)}\b", re.IGNORECASE)
        for match in regex.finditer(text):
            start, end = match.span()
            matched = match.group(0)

            # Check if active fact substantiates this claim
            substantiated = False
            if fact_id:
                substantiated = any(
                    f.get("id") == fact_id and f.get("status") == "active" for f in ctx.facts
                )

            if not substantiated:
                findings.append(
                    Finding(
                        id=f"find-claim-{ctx.review_id}-v{ctx.version}-{pattern_id.lower()}-{start}",
                        review_id=ctx.review_id,
                        version=ctx.version,
                        category="Promotional claims",
                        severity=severity_val,
                        status=FindingStatus.UNSUPPORTED,
                        method=CheckMethod.DETERMINISTIC,
                        confidence=1.0,
                        excerpt=matched,
                        start=start,
                        end=end,
                        rule_id=pattern_id,
                        fact_id=None,
                        source_title=f"Claim Policy: {raw_pattern}",
                        source_version=ctx.kit_snapshot_version,
                        reason=f"Restricted claim '{matched}' detected without approved substantiation: {reason_text}",
                        suggestion="Remove or rewrite this phrase",
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True,
                            rule_passed=False,
                            purpose_preserved=False,
                            note="Unsupported claim requires verifiable substantiation or removal.",
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

    # 2. Evaluate Generic Claims Rules from Brand Kit
    for rule in ctx.rules:
        if rule.get("status") != "active" or rule.get("category") not in (
            "Claims",
            "Promotional claims",
        ):
            continue

        rule_id = rule.get("id", "CLAIM-000")
        rule_title = rule.get("title", "Claims Restriction")
        rule_severity = Severity(rule.get("severity", "Major"))

        # Check performance / return risk disclaimer requirement
        rule_lower = rule.get("text", "").lower()
        rule_title_lower = rule.get("title", "").lower()
        if (
            "statutory risk notice" in rule_lower
            or "performance metrics" in rule_title_lower
            or "annualized yield" in rule_title_lower
            or ("historic yields" in rule_lower and "risk" in rule_lower)
        ):
            perf_match = re.search(
                r"(\d+(?:\.\d+)?%\s*(?:annualized|annual|return|gain|yield)?|annualized return|historic yields)",
                text,
                re.IGNORECASE,
            )
            if perf_match:
                has_notice = any(
                    w in text.lower()
                    for w in (
                        "market risks",
                        "risk notice",
                        "past performance is not",
                        "subject to market",
                    )
                )
                if not has_notice:
                    m_val = perf_match.group(0)
                    findings.append(
                        Finding(
                            id=f"find-claim-perf-{ctx.review_id}-v{ctx.version}-{rule_id.lower()}-{perf_match.start()}",
                            review_id=ctx.review_id,
                            version=ctx.version,
                            category="Promotional claims",
                            severity=rule_severity,
                            status=FindingStatus.CONTRADICTED,
                            method=CheckMethod.DETERMINISTIC,
                            confidence=1.0,
                            excerpt=m_val,
                            start=perf_match.start(),
                            end=perf_match.end(),
                            rule_id=rule_id,
                            fact_id=None,
                            source_title=rule_title,
                            source_version=rule.get("version", ctx.kit_snapshot_version),
                            reason=f"Performance claim '{m_val}' must be accompanied by statutory risk notice: {rule.get('text', '')}",
                            suggestion="Include required statutory risk disclosure alongside performance figures.",
                            suggestion_check=SuggestionCheck(
                                rule_rechecked=True, rule_passed=True, purpose_preserved=True
                            ),
                            decision=None,
                            created_at=now,
                        )
                    )

        banned_claims = list(rule.get("banned_terms") or [])
        if not banned_claims and rule.get("text"):
            quoted = re.findall(r"['\"](.*?)['\"]", rule.get("text", ""))
            banned_claims = [q.strip() for q in quoted if len(q.strip()) >= 1]

        # Sort banned claims descending by length to prioritize longer phrase matches
        banned_claims = sorted(banned_claims, key=len, reverse=True)
        matched_claim_spans: list[tuple[int, int]] = []

        for b_claim in banned_claims:
            regex = re.compile(rf"(?<!\w){re.escape(b_claim)}(?!\w)", re.IGNORECASE)
            for match in regex.finditer(text):
                start, end = match.span()
                matched = match.group(0)

                # Avoid duplicate / nested matches at the same or overlapping span
                if any(s <= start < e or s < end <= e for s, e in matched_claim_spans):
                    continue

                # Check if substantiated by any active fact permitted wording
                substantiated = any(
                    matched.lower() in f.get("permitted_wording", "").lower()
                    and f.get("status") == "active"
                    for f in ctx.facts
                )

                if not substantiated:
                    matched_claim_spans.append((start, end))
                    findings.append(
                        Finding(
                            id=f"find-claim-rule-{ctx.review_id}-v{ctx.version}-{rule_id.lower()}-{start}",
                            review_id=ctx.review_id,
                            version=ctx.version,
                            category="Promotional claims",
                            severity=rule_severity,
                            status=FindingStatus.UNSUPPORTED,
                            method=CheckMethod.DETERMINISTIC,
                            confidence=0.95,
                            excerpt=matched,
                            start=start,
                            end=end,
                            rule_id=rule_id,
                            fact_id=None,
                            source_title=rule_title,
                            source_version=rule.get("version", ctx.kit_snapshot_version),
                            reason=f"Claim '{matched}' lacks verifiable substantiation in facts register: {rule.get('text', '')}",
                            suggestion="Remove or rewrite this phrase",
                            suggestion_check=SuggestionCheck(
                                rule_rechecked=True,
                                rule_passed=False,
                                purpose_preserved=False,
                                note="Unsubstantiated claim requires human review.",
                            ),
                            decision=None,
                            created_at=now,
                        )
                    )

    return findings
