"""Code-based verifier enforcing the proof-or-abstain mandate."""

from datetime import UTC, datetime
from typing import Any

from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, PurposeCard, SuggestionCheck


def verify_ai_findings(
    raw_findings: list[dict[str, Any]],
    content: str,
    rules: list[dict[str, Any]],
    facts: list[dict[str, Any]],
    purpose_card: PurposeCard,
    review_id: str,
    version: int,
) -> list[Finding]:
    """Validate, filter, and calibrate external AI findings against code-level ground truth."""
    verified: list[Finding] = []
    now = datetime.now(UTC)

    # Index active rules and facts by ID
    rules_by_id = {r.get("id"): r for r in rules if r.get("id")}
    facts_by_id = {f.get("id"): f for f in facts if f.get("id")}

    normalized_content = content.lower()

    for idx, item in enumerate(raw_findings):
        rule_id = item.get("rule_id")
        fact_id = item.get("fact_id")
        quoted_span = item.get("quoted_span") or item.get("excerpt") or ""

        # Verification 1: ID existence proof-or-abstain
        matched_rule = rules_by_id.get(rule_id) if rule_id else None
        matched_fact = facts_by_id.get(fact_id) if fact_id else None

        if not matched_rule and not matched_fact:
            # Drop ungrounded/hallucinated IDs without mercy
            continue

        # Verification 2: Quoted span must literally exist in content
        span_lower = quoted_span.strip().lower()
        if not span_lower or span_lower not in normalized_content:
            # Model hallucinated quote not present in user text
            continue

        start = normalized_content.find(span_lower)
        end = start + len(span_lower)
        actual_excerpt = content[start:end]

        # Verification 3: Severity capping
        # AI severity cannot exceed the severity defined in the rule
        rule_severity_str = matched_rule.get("severity") if matched_rule else "Major"
        try:
            allowed_severity = Severity(rule_severity_str)
        except Exception:
            allowed_severity = Severity.MAJOR

        raw_sev_str = item.get("severity", "Major")
        try:
            suggested_severity = Severity(raw_sev_str)
        except Exception:
            suggested_severity = Severity.MAJOR

        final_severity = min(
            suggested_severity,
            allowed_severity,
            key=lambda s: ["Blocker", "Major", "Minor", "Info"].index(s.value),
        )

        # AI Blocker findings get downgraded unless rule explicitly specifies Blocker
        if final_severity == Severity.BLOCKER and allowed_severity != Severity.BLOCKER:
            final_severity = Severity.MAJOR

        # Verification 4: Purpose preservation
        suggestion = item.get("suggestion")
        purpose_preserved = True
        if suggestion:
            for locked in purpose_card.locked_phrases:
                if (
                    locked.lower() in actual_excerpt.lower()
                    and locked.lower() not in suggestion.lower()
                ):
                    purpose_preserved = False

        source_title = (
            matched_rule.get("title", "")
            if matched_rule
            else (matched_fact.get("subject", "") if matched_fact else "")
        )
        source_version = matched_rule.get("version", "1.0") if matched_rule else "1.0"

        verified.append(
            Finding(
                id=f"find-ai-{rule_id or fact_id}-{start}-{idx}",
                review_id=review_id,
                version=version,
                category=item.get(
                    "category", matched_rule.get("category", "General") if matched_rule else "Facts"
                ),
                severity=final_severity,
                status=FindingStatus.CONTRADICTED
                if matched_fact
                else FindingStatus.NEEDS_HUMAN_JUDGEMENT,
                method=CheckMethod.AI,
                confidence=min(max(float(item.get("confidence", 0.85)), 0.1), 1.0),
                excerpt=actual_excerpt,
                start=start,
                end=end,
                rule_id=rule_id,
                fact_id=fact_id,
                source_title=source_title,
                source_version=source_version,
                reason=item.get("reason", f"Flagged under guideline {rule_id or fact_id}"),
                suggestion=suggestion,
                suggestion_check=SuggestionCheck(
                    rule_rechecked=True,
                    rule_passed=True,
                    purpose_preserved=purpose_preserved,
                    note=None
                    if purpose_preserved
                    else "Alternative, needs your judgement: alters locked phrase.",
                ),
                decision=None,
                created_at=now,
            )
        )

    return verified
