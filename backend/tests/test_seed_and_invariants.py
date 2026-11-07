"""Tests for clean seed data (B5) and span/offset invariants (B2)."""

import json
from pathlib import Path

from app.checks.accessibility import check_accessibility_and_tone
from app.checks.claims import check_claims
from app.checks.context import CheckContext
from app.checks.facts import check_facts
from app.checks.messaging import check_messaging
from app.checks.purpose import check_purpose_card
from app.checks.terminology import check_terminology
from app.schemas.schemas import PurposeCard


def test_no_placeholder_text_in_seeded_rules():
    """B5: Seeded rules must never contain placeholder text like 'Updated', 'Test', 'Lorem', or 'TODO'."""
    seed_file = Path(__file__).parent.parent / "app" / "seed" / "brand_kits.json"
    with open(seed_file, encoding="utf-8") as f:
        kits = json.load(f)

    forbidden_words = ["updated", "test", "lorem", "todo"]

    for kit in kits:
        for rule in kit.get("rules", []):
            rule_id = rule["id"]
            title = rule.get("title", "")
            text = rule.get("text", "")

            for word in forbidden_words:
                assert word not in title.lower(), (
                    f"Rule {rule_id} title contains placeholder '{word}': {title}"
                )
                assert word not in text.lower(), (
                    f"Rule {rule_id} text contains placeholder '{word}': {text}"
                )


def test_span_offset_invariant_across_all_samples():
    """B2: For every finding emitted, content[start:end] == excerpt verbatim (or start=end=0), never truncated mid-token."""
    seed_file = Path(__file__).parent.parent / "app" / "seed" / "brand_kits.json"
    with open(seed_file, encoding="utf-8") as f:
        kits = {k["id"]: k for k in json.load(f)}

    samples_file = Path(__file__).parent.parent / "app" / "seed" / "sample_drafts.json"
    with open(samples_file, encoding="utf-8") as f:
        samples = json.load(f)

    for sample in samples:
        kit = kits[sample["brand_kit_id"]]
        ctx = CheckContext(
            review_id="test-review",
            version=1,
            brand_kit_id=sample["brand_kit_id"],
            text=sample["content"],
            content_type=sample["content_type"],
            ai_declared=sample.get("ai_declared", False),
            purpose_card=PurposeCard(**sample["purpose_card"]),
            rules=kit.get("rules", []),
            facts=kit.get("facts", []),
            target_reading_level=kit.get("target_reading_level", 8),
        )

        all_findings = []
        all_findings.extend(check_terminology(ctx))
        all_findings.extend(check_messaging(ctx))
        all_findings.extend(check_claims(ctx))
        all_findings.extend(check_facts(ctx))
        all_findings.extend(check_purpose_card(ctx))
        all_findings.extend(check_accessibility_and_tone(ctx))

        for f in all_findings:
            # Rule 1: Never trailing whitespace in excerpts
            assert not f.excerpt.endswith(" ") and not f.excerpt.startswith(" "), (
                f"Finding {f.id} has trailing or leading whitespace in excerpt: '{f.excerpt}'"
            )

            # Rule 2: Invariant test: if start or end > 0, content[start:end] == excerpt verbatim
            if f.start > 0 or f.end > 0:
                extracted = sample["content"][f.start : f.end]
                assert extracted == f.excerpt, (
                    f"Offset mismatch on finding {f.id}: content[{f.start}:{f.end}]='{extracted}' != excerpt='{f.excerpt}'"
                )
            else:
                # Missing constraint / document-level finding: start=0, end=0
                assert f.start == 0 and f.end == 0


def test_sample_drafts_never_mention_foreign_brands_or_domains():
    """Every sample purpose card and draft must only reference its own brand kit identity."""
    samples_file = Path(__file__).parent.parent / "app" / "seed" / "sample_drafts.json"
    with open(samples_file, encoding="utf-8") as f:
        samples = json.load(f)

    # Disallowed cross-brand references per brand kit
    cross_brand_forbidden = {
        "kettle-and-co": ["chaicraft", "chaicraft.in", "ledgerleaf", "leafsave"],
        "ledgerleaf": ["kettle", "chaicraft", "chaicraft.in", "masala chai"],
    }

    for sample in samples:
        kit_id = sample["brand_kit_id"]
        forbidden_list = cross_brand_forbidden.get(kit_id, [])

        purpose = sample.get("purpose_card", {})
        combined_text = " ".join(
            [
                sample.get("content", ""),
                purpose.get("goal", ""),
                purpose.get("audience", ""),
                purpose.get("key_message", ""),
                purpose.get("call_to_action", ""),
                " ".join(purpose.get("locked_phrases", [])),
            ]
        ).lower()

        for forbidden in forbidden_list:
            assert forbidden not in combined_text, (
                f"Sample {sample['id']} ({kit_id}) improperly references foreign brand or domain '{forbidden}': {combined_text}"
            )
