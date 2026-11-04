"""Repository for brand insights, rule ambiguity metrics, and simulated events."""

from app.constants import Severity
from app.models.entities import SimulatedEventModel
from app.schemas.schemas import (
    AmbiguousRuleStat,
    InsightsResponse,
    RuleOverrideStat,
    RuleViolationStat,
)
from sqlalchemy.orm import Session


class InsightsRepository:
    """Aggregates rule violations, overrides, and ambiguity indices."""

    def __init__(self, db: Session):
        self.db = db

    def get_insights(self, brand_kit_id: str | None = None) -> InsightsResponse:
        """Calculate calm, explainable brand insights."""
        query = self.db.query(SimulatedEventModel)
        if brand_kit_id:
            query = query.filter(SimulatedEventModel.brand_kit_id == brand_kit_id)

        all_events = query.all()
        total_count = len(all_events)

        # 1. Top repeated violations
        violations = [e for e in all_events if e.action in ("violation_detected", "violated")]
        rule_counts: dict[str, dict] = {}
        for v in violations:
            if v.rule_id not in rule_counts:
                rule_counts[v.rule_id] = {
                    "rule_id": v.rule_id,
                    "rule_name": v.rule_name,
                    "category": v.category,
                    "severity": v.severity,
                    "count": 0,
                }
            rule_counts[v.rule_id]["count"] += 1

        sorted_violations = sorted(rule_counts.values(), key=lambda x: x["count"], reverse=True)[:5]
        top_violations = [
            RuleViolationStat(
                rule_id=item["rule_id"],
                rule_name=item["rule_name"],
                category=item["category"],
                severity=Severity(item["severity"])
                if item["severity"] in [s.value for s in Severity]
                else Severity.MAJOR,
                count=item["count"],
                simulated=True,
            )
            for item in sorted_violations
        ]

        # 2. Most overridden rules
        overrides = [e for e in all_events if e.action == "overridden"]
        override_map: dict[str, dict] = {}
        for o in overrides:
            if o.rule_id not in override_map:
                override_map[o.rule_id] = {
                    "rule_id": o.rule_id,
                    "rule_name": o.rule_name,
                    "category": o.category,
                    "override_count": 0,
                    "reasons": [],
                }
            override_map[o.rule_id]["override_count"] += 1
            if o.reason and o.reason not in override_map[o.rule_id]["reasons"]:
                override_map[o.rule_id]["reasons"].append(o.reason)

        sorted_overrides = sorted(
            override_map.values(), key=lambda x: x["override_count"], reverse=True
        )[:5]
        most_overridden = [
            RuleOverrideStat(
                rule_id=item["rule_id"],
                rule_name=item["rule_name"],
                category=item["category"],
                override_count=item["override_count"],
                reasons=item["reasons"][:3],
                simulated=True,
            )
            for item in sorted_overrides
        ]

        # 3. Rule ambiguity calculation
        # Ambiguity score = (overrides / (violations + overrides)) bounded between 0 and 1
        ambiguous_rules: list[AmbiguousRuleStat] = []
        for rule_id, v_data in rule_counts.items():
            o_data = override_map.get(rule_id, {"override_count": 0})
            v_cnt = v_data["count"]
            o_cnt = o_data["override_count"]
            total_rule_evals = v_cnt + o_cnt
            if total_rule_evals >= 3:
                score = round(o_cnt / total_rule_evals, 2)
                if score >= 0.25:
                    rec = "Reviewers frequently override this rule. Recommend clarifying exceptions in Brand Hub."
                else:
                    rec = "Rule is consistently respected with low reviewer disagreement."
                ambiguous_rules.append(
                    AmbiguousRuleStat(
                        rule_id=rule_id,
                        rule_name=v_data["rule_name"],
                        category=v_data["category"],
                        violation_count=v_cnt,
                        override_count=o_cnt,
                        ambiguity_score=score,
                        recommendation=rec,
                        simulated=True,
                    )
                )

        ambiguous_rules.sort(key=lambda x: x.ambiguity_score, reverse=True)

        return InsightsResponse(
            total_events=total_count,
            top_repeated_violations=top_violations,
            most_overridden_rules=most_overridden,
            unclear_rules=ambiguous_rules[:5],
            simulated_notice="Seed insights are populated with simulated review events for demonstration.",
        )
