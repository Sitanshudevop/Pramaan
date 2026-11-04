"""Golden dataset evaluation measuring precision and recall on labelled drafts."""

import json
from pathlib import Path

from app.checks.context import CheckContext
from app.checks.runner import run_deterministic_checks
from app.schemas.schemas import PurposeCard


def load_brand_kits():
    seed_path = Path(__file__).parent.parent / "app" / "seed" / "brand_kits.json"
    with open(seed_path, encoding="utf-8") as f:
        kits = json.load(f)
    return {k["id"]: k for k in kits}


def load_golden_set():
    golden_path = Path(__file__).parent / "golden" / "dataset.json"
    with open(golden_path, encoding="utf-8") as f:
        return json.load(f)


def test_golden_dataset_metrics():
    """Run all 22 labelled golden drafts and compute precision, recall, and false positives."""
    brand_kits = load_brand_kits()
    golden_cases = load_golden_set()

    true_positives = 0
    false_positives = 0
    false_negatives = 0
    clean_drafts_tested = 0
    clean_drafts_passed = 0

    for item in golden_cases:
        kit_id = item["brand_kit_id"]
        kit = brand_kits[kit_id]
        content = item["content"]
        expected_ids = set(item.get("expected_rule_ids", []))
        expected_violations = item.get("expected_violation_count", 0)

        # Set CTA to a word from the content to test pure guideline checks without unconfigured CTA noise
        first_word = content.split()[0] if content.split() else "Enjoy"
        locked_phrase = (
            "Masala Chai"
            if kit_id == "kettle-and-co" and "Masala Chai" in content
            else ("LedgerLeaf Plus" if "LedgerLeaf Plus" in content else "")
        )

        purpose = PurposeCard(
            goal="Golden verification goal",
            audience="General audience",
            key_message="Ground truth verification",
            call_to_action=first_word,
            locked_phrases=[locked_phrase] if locked_phrase else [],
        )

        ctx = CheckContext(
            text=content,
            rules=kit["rules"],
            facts=kit["facts"],
            purpose_card=purpose,
            brand_kit_id=kit_id,
            content_type=item.get("content_type", "Standard Copy"),
            ai_declared="Created with AI assistance" in content,
        )

        findings = run_deterministic_checks(ctx)
        actual_ids = {f.rule_id for f in findings if f.rule_id} | {
            f.fact_id for f in findings if f.fact_id
        }

        if expected_violations == 0:
            clean_drafts_tested += 1
            if len(findings) == 0:
                clean_drafts_passed += 1
            else:
                false_positives += len(findings)
        else:
            matched_expected = expected_ids.intersection(actual_ids)
            true_positives += len(matched_expected)
            false_negatives += len(expected_ids - actual_ids)
            unprompted_findings = actual_ids - expected_ids
            false_positives += len(unprompted_findings)

    # Compute measured metrics
    precision = (
        true_positives / (true_positives + false_positives)
        if (true_positives + false_positives) > 0
        else 1.0
    )
    recall = (
        true_positives / (true_positives + false_negatives)
        if (true_positives + false_negatives) > 0
        else 1.0
    )

    print("\n--- GOLDEN BENCHMARK RESULTS ---")
    print(f"Total drafts evaluated: {len(golden_cases)}")
    print(f"Clean drafts evaluated: {clean_drafts_tested} (Passed clean: {clean_drafts_passed})")
    print(
        f"True Positives: {true_positives}, False Positives: {false_positives}, False Negatives: {false_negatives}"
    )
    print(f"Precision: {precision:.2%}, Recall: {recall:.2%}")

    # Golden dataset performance criteria
    assert clean_drafts_passed == clean_drafts_tested, (
        f"Clean drafts must pass (got {clean_drafts_passed}/{clean_drafts_tested})"
    )
    assert recall >= 0.85, f"Recall {recall:.2%} must be at least 85%"
    assert precision >= 0.85, f"Precision {precision:.2%} must be at least 85%"
