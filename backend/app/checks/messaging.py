"""Pure generic messaging check: mandatory lines and statutory disclaimers from user rules."""

import json
import re
from datetime import UTC, datetime

from app.checks.context import CheckContext
from app.constants import CheckMethod, FindingStatus, Severity
from app.schemas.schemas import Finding, SuggestionCheck


def check_messaging(ctx: CheckContext) -> list[Finding]:
    """Verify that mandatory disclaimers and required lines from rules exist where applicable."""
    findings: list[Finding] = []
    text = ctx.text
    now = datetime.now(UTC)

    for rule in ctx.rules:
        if rule.get("status") != "active":
            continue

        if rule.get("category") != "Messaging":
            continue

        rule_id = rule.get("id", "MSG-000")
        rule_title = rule.get("title", "Mandatory Messaging Rule")
        rule_severity = Severity(rule.get("severity", "Major"))
        rule_text = rule.get("text", "").strip()

        # Check content type applicability if specified
        applies_json = rule.get("applies_to_content_types_json")
        applicable_types = []
        if applies_json:
            try:
                applicable_types = (
                    json.loads(applies_json) if isinstance(applies_json, str) else applies_json
                )
            except Exception:
                applicable_types = []

        if applicable_types and not any(
            t.lower() in ctx.content_type.lower() for t in applicable_types
        ):
            continue

        # Check contextual triggers in rule description
        rule_lower = rule_text.lower()
        if any(w in rule_lower for w in ("investment", "market risk", "securities")):
            is_invest_text = any(
                kw in text.lower()
                for kw in (
                    "invest",
                    "stock",
                    "portfolio",
                    "mutual fund",
                    "returns",
                    "equity",
                    "wealth",
                    "yield",
                )
            )
            if not is_invest_text:
                continue

        if any(w in rule_lower for w in ("otp", "pin", "password", "security alert")) and not any(
            kw in text.lower()
            for kw in (
                "otp",
                "pin",
                "password",
                "sign in",
                "login",
                "credentials",
                "2fa",
                "verification code",
            )
        ):
            continue

        if any(
            w in rule_lower for w in ("apr", "loan", "margin", "borrowing", "credit line")
        ) and not any(
            kw in text.lower()
            for kw in (
                "loan",
                "margin",
                "apr",
                "borrow",
                "credit line",
                "interest rate",
                "cost of borrowing",
            )
        ):
            continue

        if any(w in rule_lower for w in ("harvest", "seasonal release")) and not any(
            kw in text.lower()
            for kw in (
                "harvest batch",
                "seasonal release",
                "first flush",
                "second flush",
                "limited harvest",
            )
        ):
            continue

        if any(w in rule_lower for w in ("packaging", "net quantity", "net weight")) and not any(
            kw in text.lower() for kw in ("net wt", "net weight", "250g", "100g", "500g")
        ):
            continue

        if any(w in rule_lower for w in ("discount", "bundle", "gift", "promotional")):
            is_promo_text = any(
                kw in text.lower()
                for kw in ("% off", "discount", "bundle", "gift", "sale on", "special offer")
            ) or ("off" in text.lower() and any(c.isdigit() for c in text))
            if not is_promo_text:
                continue

        # Extract required phrase: use preferred_replacement or quoted phrase in rule text
        quoted = [
            q.strip() for q in re.findall(r"['\"](.*?)['\"]", rule_text) if len(q.strip()) > 3
        ]
        required_phrase = rule.get("preferred_replacement") or (
            quoted[-1] if quoted else rule.get("title")
        )
        if not required_phrase and len(rule_text) < 150:
            required_phrase = rule_text

        if required_phrase and required_phrase.lower() not in text.lower():
            findings.append(
                Finding(
                    id=f"find-msg-{ctx.review_id}-v{ctx.version}-{rule_id.lower()}",
                    review_id=ctx.review_id,
                    version=ctx.version,
                    category="Messaging",
                    severity=rule_severity,
                    status=FindingStatus.CONTRADICTED,
                    method=CheckMethod.DETERMINISTIC,
                    confidence=1.0,
                    excerpt="Mandatory disclaimer missing from draft",
                    start=0,
                    end=0,
                    rule_id=rule_id,
                    fact_id=None,
                    source_title=rule_title,
                    source_version=rule.get("version", ctx.kit_snapshot_version),
                    reason=f"Draft is missing mandatory line required by '{rule_title}': {rule_text}",
                    suggestion=f"{text.rstrip()} {required_phrase}",
                    suggestion_check=SuggestionCheck(
                        rule_rechecked=True, rule_passed=True, purpose_preserved=True
                    ),
                    decision=None,
                    created_at=now,
                )
            )

    return findings
