"""Orchestrator for all deterministic checks."""

from app.checks.accessibility import check_accessibility_and_tone
from app.checks.claims import check_claims
from app.checks.context import CheckContext
from app.checks.disclosure import check_disclosure
from app.checks.facts import check_facts
from app.checks.messaging import check_messaging
from app.checks.purpose import check_purpose_card
from app.checks.terminology import check_terminology
from app.constants import Severity
from app.schemas.schemas import Finding

SEVERITY_ORDER = {
    Severity.BLOCKER: 0,
    Severity.MAJOR: 1,
    Severity.MINOR: 2,
    Severity.INFO: 3,
}


def run_deterministic_checks(ctx: CheckContext) -> list[Finding]:
    """Execute all pure deterministic checks and return sorted findings."""
    all_findings: list[Finding] = []

    all_findings.extend(check_terminology(ctx))
    all_findings.extend(check_messaging(ctx))
    all_findings.extend(check_claims(ctx))
    all_findings.extend(check_facts(ctx))
    all_findings.extend(check_purpose_card(ctx))
    all_findings.extend(check_accessibility_and_tone(ctx))
    all_findings.extend(check_disclosure(ctx))

    # De-duplicate by unique finding id or exact span+rule
    seen_keys: set[str] = set()
    deduped: list[Finding] = []
    for f in all_findings:
        key = f"{f.rule_id or ''}:{f.fact_id or ''}:{f.start}:{f.end}:{f.category}"
        if key not in seen_keys:
            seen_keys.add(key)
            deduped.append(f)

    # Sort by severity (Blocker -> Major -> Minor -> Info) and then start offset
    deduped.sort(key=lambda x: (SEVERITY_ORDER.get(x.severity, 4), x.start))
    return deduped

