"""Unit tests for pure deterministic check functions."""

import json
from pathlib import Path

import pytest
from app.checks.claims import check_claims
from app.checks.context import CheckContext
from app.checks.disclosure import check_disclosure
from app.checks.facts import check_facts
from app.checks.messaging import check_messaging
from app.checks.purpose import check_purpose_card
from app.checks.terminology import check_terminology
from app.constants import FindingStatus, Severity
from app.schemas.schemas import PurposeCard


@pytest.fixture
def kettle_rules_and_facts():
    seed_path = Path(__file__).parent.parent / "app" / "seed" / "brand_kits.json"
    with open(seed_path, encoding="utf-8") as f:
        kits = json.load(f)
    kettle = [k for k in kits if k["id"] == "kettle-and-co"][0]
    return kettle["rules"], kettle["facts"]


@pytest.fixture
def ledger_rules_and_facts():
    seed_path = Path(__file__).parent.parent / "app" / "seed" / "brand_kits.json"
    with open(seed_path, encoding="utf-8") as f:
        kits = json.load(f)
    ledger = [k for k in kits if k["id"] == "ledgerleaf"][0]
    return ledger["rules"], ledger["facts"]


def test_banned_terms_detected(kettle_rules_and_facts):
    rules, facts = kettle_rules_and_facts
    purpose = PurposeCard(
        goal="Test goal",
        audience="Test audience",
        key_message="Test message",
        call_to_action="Order now",
        locked_phrases=["Masala Chai"],
    )
    ctx = CheckContext(
        text="Our cheap tea is a miracle blend.",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        brand_kit_id="kettle-and-co",
    )
    findings = check_terminology(ctx)
    assert len(findings) == 2
    excerpts = [f.excerpt.lower() for f in findings]
    assert "cheap" in excerpts
    assert "miracle" in excerpts
    assert all(f.severity == Severity.BLOCKER for f in findings)


def test_clean_terminology_passes(kettle_rules_and_facts):
    rules, facts = kettle_rules_and_facts
    purpose = PurposeCard(
        goal="Test goal",
        audience="Test audience",
        key_message="Test message",
        call_to_action="Order now",
        locked_phrases=["Masala Chai"],
    )
    ctx = CheckContext(
        text="Enjoy our celebrated Masala Chai crafted with care.",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        brand_kit_id="kettle-and-co",
    )
    findings = check_terminology(ctx)
    assert len(findings) == 0


def test_product_casing_and_spelling(kettle_rules_and_facts):
    rules, facts = kettle_rules_and_facts
    purpose = PurposeCard(
        goal="Test goal",
        audience="Test audience",
        key_message="Test message",
        call_to_action="Order now",
    )
    ctx = CheckContext(
        text="Welcome to Kettle and Co. Appreciate our rich flavor.",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        brand_kit_id="kettle-and-co",
    )
    findings = check_terminology(ctx)
    assert any(f.rule_id == "TERM-002" for f in findings)
    assert any(f.rule_id == "TERM-003" for f in findings)


def test_messaging_mandatory_disclaimer(kettle_rules_and_facts):
    rules, facts = kettle_rules_and_facts
    purpose = PurposeCard(
        goal="Test sale",
        audience="Customers",
        key_message="Discount on packs",
        call_to_action="Buy now",
    )
    ctx = CheckContext(
        text="Get 20% off all gift packs today!",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        brand_kit_id="kettle-and-co",
        content_type="Promotional Email",
    )
    findings = check_messaging(ctx)
    assert len(findings) == 1
    assert findings[0].rule_id == "MSG-001"
    assert "Offer valid while stocks last" in findings[0].suggestion


def test_health_claims_and_superlatives(kettle_rules_and_facts):
    rules, facts = kettle_rules_and_facts
    purpose = PurposeCard(
        goal="Launch",
        audience="Tea lovers",
        key_message="Health benefits",
        call_to_action="Try it",
    )
    ctx = CheckContext(
        text="This blend is clinically proven to cure stress! It is the best tea.",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        brand_kit_id="kettle-and-co",
    )
    findings = check_claims(ctx)
    assert any(f.rule_id == "CLAIM-4.2" and f.severity == Severity.BLOCKER for f in findings)
    assert any(f.rule_id == "CLAIM-3.1" for f in findings)


def test_stale_fact_contradiction(kettle_rules_and_facts):
    rules, facts = kettle_rules_and_facts
    purpose = PurposeCard(
        goal="Pricing",
        audience="Customers",
        key_message="Price update",
        call_to_action="Order now",
    )
    ctx = CheckContext(
        text="Masala Chai is just ₹299 this week.",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        brand_kit_id="kettle-and-co",
    )
    findings = check_facts(ctx)
    assert len(findings) == 1
    assert findings[0].fact_id == "F-15"
    assert findings[0].status == FindingStatus.CONTRADICTED
    assert "expired" in findings[0].reason.lower()


def test_purpose_card_locked_phrases(kettle_rules_and_facts):
    rules, facts = kettle_rules_and_facts
    purpose = PurposeCard(
        goal="Brand post",
        audience="Everyone",
        key_message="Tradition",
        call_to_action="Visit site",
        locked_phrases=["Masala Chai"],
    )
    ctx = CheckContext(
        text="Discover our rich morning breakfast tea.",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        brand_kit_id="kettle-and-co",
    )
    findings = check_purpose_card(ctx)
    assert any(f.category == "Purpose card" and "Masala Chai" in f.reason for f in findings)


def test_ai_disclosure_required_when_declared(kettle_rules_and_facts):
    rules, facts = kettle_rules_and_facts
    purpose = PurposeCard(
        goal="AI generated copy",
        audience="General",
        key_message="Fast copy",
        call_to_action="Read more",
        ai_declared=True,
    )
    ctx = CheckContext(
        text="Here is a wonderful announcement about our tea.",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        brand_kit_id="kettle-and-co",
        ai_declared=True,
    )
    findings = check_disclosure(ctx)
    assert len(findings) == 1
    assert findings[0].rule_id == "AI-001"
    assert "Created with AI assistance" in findings[0].suggestion
