"""Repository for brand insights, rule ambiguity metrics, and compliance analytics."""

from app.constants import Severity
from app.models.entities import DecisionModel, FindingModel, ReviewModel, RuleModel, WorkspaceModel
from app.schemas.schemas import (
    AmbiguousRuleStat,
    InsightsResponse,
    RuleOverrideStat,
    RuleViolationStat,
)
from sqlalchemy.orm import Session


class InsightsRepository:
    """Aggregates rule violations, overrides, and ambiguity indices strictly from real review findings."""

    def __init__(self, db: Session, workspace_id: str | None = None):
        self.db = db
        self.workspace_id = workspace_id or "ws-demo"

    def get_insights(self, brand_kit_id: str | None = None) -> InsightsResponse:
        """Calculate calm, explainable brand insights strictly from real review findings and decisions."""
        # Query reviews belonging to this workspace
        review_query = self.db.query(ReviewModel).filter(
            ReviewModel.workspace_id == self.workspace_id
        )
        if brand_kit_id:
            review_query = review_query.filter(ReviewModel.kit_id == brand_kit_id)

        review_ids = [r.id for r in review_query.all()]
        ws = self.db.query(WorkspaceModel).filter(WorkspaceModel.id == self.workspace_id).first()
        is_demo = ws.is_demo if ws else (self.workspace_id == "ws-demo")

        if not review_ids:
            return InsightsResponse(
                total_events=0,
                top_repeated_violations=[],
                most_overridden_rules=[],
                unclear_rules=[],
                simulated_notice="Demo data is fictional" if is_demo else None,
            )

        # 1. Fetch all findings associated with these reviews
        findings = (
            self.db.query(FindingModel)
            .filter(FindingModel.review_id.in_(review_ids), FindingModel.rule_id.isnot(None))
            .all()
        )

        # 2. Fetch all rules for title lookup
        rules_lookup: dict[str, RuleModel] = {str(r.id): r for r in self.db.query(RuleModel).all()}

        # 3. Aggregate violations by rule_id
        rule_counts: dict[str, dict] = {}
        for f in findings:
            if not f.rule_id:
                continue
            r_id = str(f.rule_id)
            if r_id not in rule_counts:
                rule_obj = rules_lookup.get(r_id)
                rule_counts[r_id] = {
                    "rule_id": r_id,
                    "rule_name": rule_obj.title if rule_obj else (f.source_title or r_id),
                    "category": f.category,
                    "severity": f.severity,
                    "count": 0,
                }
            rule_counts[r_id]["count"] += 1

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
                simulated=False,
            )
            for item in sorted_violations
        ]

        # 4. Fetch human decisions on these findings (overrides)
        finding_ids = [f.id for f in findings]
        override_decisions = []
        if finding_ids:
            override_decisions = (
                self.db.query(DecisionModel)
                .filter(
                    DecisionModel.finding_id.in_(finding_ids), DecisionModel.action == "override"
                )
                .all()
            )

        # Map finding_id to rule_id
        finding_to_rule = {f.id: f.rule_id for f in findings if f.rule_id}

        override_map: dict[str, dict] = {}
        for o in override_decisions:
            r_id = finding_to_rule.get(o.finding_id)
            if not r_id:
                continue
            if r_id not in override_map:
                rule_obj = rules_lookup.get(r_id)
                override_map[r_id] = {
                    "rule_id": r_id,
                    "rule_name": rule_obj.title if rule_obj else r_id,
                    "category": rule_obj.category if rule_obj else "Guidelines",
                    "override_count": 0,
                    "reasons": [],
                }
            override_map[r_id]["override_count"] += 1
            if o.reason and o.reason not in override_map[r_id]["reasons"]:
                override_map[r_id]["reasons"].append(o.reason)

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
                simulated=False,
            )
            for item in sorted_overrides
        ]

        # 5. Rule Ambiguity Calculation
        ambiguous_rules: list[AmbiguousRuleStat] = []
        for r_id, v_data in rule_counts.items():
            o_data = override_map.get(r_id, {"override_count": 0})
            v_cnt = v_data["count"]
            o_cnt = o_data["override_count"]
            total_evals = v_cnt + o_cnt
            if total_evals >= 3:
                score = round(o_cnt / total_evals, 2)
                if score >= 0.25:
                    rec = "Reviewers frequently override this rule. Recommend clarifying exceptions in Brand Hub."
                else:
                    rec = "Rule is consistently respected with low reviewer disagreement."
                ambiguous_rules.append(
                    AmbiguousRuleStat(
                        rule_id=r_id,
                        rule_name=v_data["rule_name"],
                        category=v_data["category"],
                        violation_count=v_cnt,
                        override_count=o_cnt,
                        ambiguity_score=score,
                        recommendation=rec,
                        simulated=False,
                    )
                )

        ambiguous_rules.sort(key=lambda x: x.ambiguity_score, reverse=True)

        # Total compliance events: all rule findings flagged + all human decisions taken
        total_decisions = (
            self.db.query(DecisionModel).filter(DecisionModel.finding_id.in_(finding_ids)).count()
            if finding_ids
            else 0
        )
        total_count = len(findings) + total_decisions

        return InsightsResponse(
            total_events=total_count,
            top_repeated_violations=top_violations,
            most_overridden_rules=most_overridden,
            unclear_rules=ambiguous_rules[:5],
            simulated_notice="Demo data is fictional" if is_demo else None,
        )
