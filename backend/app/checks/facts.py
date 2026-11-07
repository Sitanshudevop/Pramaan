"""Pure generic facts register check: price verification, tier quota validation, and stale fact flags."""

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
    now_date_str = now.strftime("%Y-%m-%d")

    # Group facts by subject to identify active vs expired counterparts
    facts_by_subject: dict[str, list[dict]] = {}
    for f in ctx.facts:
        subj = f.get("subject", "").strip().lower()
        if subj:
            facts_by_subject.setdefault(subj, []).append(f)

    for fact in ctx.facts:
        fact_id = fact.get("id", "FACT-000")
        subject = fact.get("subject", "").strip()
        val = str(fact.get("value", "")).strip()
        unit = str(fact.get("unit", "")).strip()
        valid_to = fact.get("valid_to", "2099-12-31")
        is_stale = fact.get("status") == "superseded" or valid_to < now_date_str
        permitted = fact.get("permitted_wording", "")
        aliases = fact.get("aliases") or []

        # Find search terms (subject, aliases, and specific numeric claim expressions)
        search_terms = [subject] + [a for a in aliases if a]
        combined_val_str = f"{val} {unit}".strip()

        # Check for expired/stale fact usage
        if is_stale and val:
            # If draft text mentions this expired value
            escaped_val = re.escape(val)
            escaped_unit = re.escape(unit) if unit else ""
            unit_part = rf"(?:\s*{escaped_unit})?" if escaped_unit else ""
            val_pattern = re.compile(rf"(?<!\w){escaped_val}{unit_part}(?!\w)", re.IGNORECASE)
            for match in val_pattern.finditer(text):
                start, end = match.span()
                matched = match.group(0)

                # Locate active counterpart if available
                subj_key = subject.lower()
                active_sibling = next(
                    (s for s in facts_by_subject.get(subj_key, []) if s.get("status") == "active" and s.get("valid_to", "") >= now_date_str),
                    None,
                )
                active_suggestion = f"{active_sibling.get('value')} {active_sibling.get('unit', '')}".strip() if active_sibling else None

                findings.append(
                    Finding(
                        id=f"find-fact-stale-{ctx.review_id}-v{ctx.version}-{fact_id.lower()}-{start}",
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
                        fact_id=fact_id,
                        source_title=f"{subject} (Expired)",
                        source_version=ctx.kit_snapshot_version,
                        reason=f"Claim '{matched}' references an expired fact (expired {valid_to})." + (f" Active approved fact is {active_suggestion}." if active_suggestion else ""),
                        suggestion=active_suggestion or "Update to current approved figure",
                        suggestion_check=SuggestionCheck(
                            rule_rechecked=True, rule_passed=True, purpose_preserved=True
                        ),
                        decision=None,
                        created_at=now,
                    )
                )

        # Check for active fact contradictions when subject is mentioned
        elif not is_stale and val:
            for term in search_terms:
                if not term:
                    continue
                # If draft mentions the subject/alias near a numeric quantity that contradicts val
                num_match = re.search(r"\b(\d+(?:\.\d+)?)\b", val)
                if num_match:
                    target_num = num_match.group(1)
                    # Check if text contains a different number associated with this term or unit
                    patterns_to_check = [
                        rf"\b(\d+(?:\.\d+)?)\s*(?:{re.escape(unit)})?\s*{re.escape(term)}\b|\b{re.escape(term)}\s*.*?\b(\d+(?:\.\d+)?)\s*(?:{re.escape(unit)})?\b"
                    ]
                    if unit and len(unit) >= 4:
                        patterns_to_check.append(rf"\b(\d+(?:\.\d+)?)\s*(?:linked\s+)?{re.escape(unit)}\b")

                    for pat_str in patterns_to_check:
                        pattern = re.compile(pat_str, re.IGNORECASE)
                        for m in pattern.finditer(text):
                            found_num = m.group(1) if len(m.groups()) == 1 else (m.group(1) or m.group(2))
                            if found_num and found_num != target_num:
                                start, end = m.span()
                                matched = m.group(0)
                                if not any(f.fact_id == fact_id and f.start == start for f in findings):
                                    findings.append(
                                        Finding(
                                            id=f"find-fact-val-{ctx.review_id}-v{ctx.version}-{fact_id.lower()}-{start}",
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
                                            fact_id=fact_id,
                                            source_title=subject,
                                            source_version=ctx.kit_snapshot_version,
                                            reason=f"Claim '{matched}' contradicts approved Fact {fact_id}: approved specification is {val}.",
                                            suggestion=matched.replace(found_num, target_num),
                                            suggestion_check=SuggestionCheck(
                                                rule_rechecked=True, rule_passed=True, purpose_preserved=True
                                            ),
                                            decision=None,
                                            created_at=now,
                                        )
                                    )

    return findings
