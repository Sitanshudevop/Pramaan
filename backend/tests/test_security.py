"""Security tests: Role enforcement matrix, prompt injection immunity, PII redaction, and hallucination guard."""

import pytest
from app.ai.pii import redact_pii
from app.ai.verifier import verify_ai_findings
from app.main import app
from app.schemas.schemas import PurposeCard
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    return TestClient(app)


def test_pii_redaction_gateway():
    """Verify that emails, phone numbers, and card/ID runs are stripped."""
    sample_text = (
        "Contact me at founder@example.com or call +91 9876543210. "
        "Aadhaar is 1234 5678 9012 and card is 4111 2222 3333 4444."
    )
    res = redact_pii(sample_text)
    assert res.has_pii is True
    assert "founder@example.com" not in res.sanitized_text
    assert "9876543210" not in res.sanitized_text
    assert "1234 5678 9012" not in res.sanitized_text
    assert "4111 2222 3333 4444" not in res.sanitized_text
    assert "[REDACTED_EMAIL]" in res.sanitized_text
    assert "[REDACTED_PHONE]" in res.sanitized_text
    assert "[REDACTED_ID_NUMBER]" in res.sanitized_text
    assert "[REDACTED_CARD_NUMBER]" in res.sanitized_text


def test_hallucination_guard_drops_fake_ids():
    """Verify that findings with non-existent rule or fact IDs are dropped by the verifier."""
    rules = [
        {
            "id": "TERM-001",
            "title": "Banned terms",
            "category": "Terminology",
            "severity": "Blocker",
            "version": "1.0",
        }
    ]
    facts: list[dict[str, str]] = []
    purpose = PurposeCard(
        goal="Test",
        audience="Test",
        key_message="Test",
        call_to_action="Test",
    )
    raw_ai_findings = [
        {
            "rule_id": "FAKE-999",  # Invented rule ID
            "quoted_span": "cheap tea",
            "category": "Terminology",
            "severity": "Blocker",
            "reason": "Made up rule",
        },
        {
            "rule_id": "TERM-001",
            "quoted_span": "cheap tea",
            "category": "Terminology",
            "severity": "Blocker",
            "reason": "Valid rule",
        },
    ]
    verified = verify_ai_findings(
        raw_findings=raw_ai_findings,
        content="Here is some cheap tea for everyone.",
        rules=rules,
        facts=facts,
        purpose_card=purpose,
        review_id="rev-test",
        version=1,
    )
    # The FAKE-999 finding MUST be dropped
    assert len(verified) == 1
    assert verified[0].rule_id == "TERM-001"


def test_hallucination_guard_drops_hallucinated_quotes():
    """Verify that findings quoting text not present in the content are dropped."""
    rules = [
        {
            "id": "TERM-001",
            "title": "Banned terms",
            "category": "Terminology",
            "severity": "Blocker",
            "version": "1.0",
        }
    ]
    purpose = PurposeCard(
        goal="Test",
        audience="Test",
        key_message="Test",
        call_to_action="Test",
    )
    raw_ai_findings = [
        {
            "rule_id": "TERM-001",
            "quoted_span": "completely non-existent phrase that user never wrote",
            "category": "Terminology",
            "severity": "Blocker",
            "reason": "Hallucinated quote",
        }
    ]
    verified = verify_ai_findings(
        raw_findings=raw_ai_findings,
        content="Our tea is fresh and pure.",
        rules=rules,
        facts=[],
        purpose_card=purpose,
        review_id="rev-test",
        version=1,
    )
    assert len(verified) == 0


def test_creator_cannot_approve_review(client):
    """Enforce role permissions: Creator role cannot approve a review."""
    # First create a review as Creator
    res = client.post(
        "/api/reviews",
        headers={"X-Demo-Role": "Creator"},
        json={
            "brand_kit_id": "kettle-and-co",
            "content": "Fresh pure organic Masala Chai for your morning routine.",
            "content_type": "Promotional Copy",
            "purpose_card": {
                "goal": "Test",
                "audience": "Test",
                "key_message": "Test",
                "call_to_action": "Order now",
                "locked_phrases": ["Masala Chai"],
                "content_type": "Promotional Copy",
                "ai_declared": False,
            },
            "ai_declared": False,
        },
    )
    assert res.status_code == 201
    rev_id = res.json()["id"]

    # Attempt to approve as Creator -> must return 403 Forbidden
    approve_res = client.post(
        f"/api/reviews/{rev_id}/approval",
        headers={"X-Demo-Role": "Creator"},
        json={"outcome": "Approved", "reason": "Self-approval attempt"},
    )
    assert approve_res.status_code == 403
    assert "FORBIDDEN" in approve_res.json()["detail"]["error"]["code"]


def test_creator_cannot_publish_guidelines(client):
    """Creator role cannot update or publish guidelines in Brand Hub."""
    res = client.patch(
        "/api/brands/kettle-and-co/rules/TERM-001",
        headers={"X-Demo-Role": "Creator"},
        json={"title": "Unauthorized Change", "reason": "Testing permission enforcement"},
    )
    assert res.status_code == 403


def test_submit_review_role_permissions(client):
    """Enforce review submission permissions: Creator and Brand Manager can submit; Reviewer and Admin return 403."""
    payload = {
        "brand_kit_id": "kettle-and-co",
        "content": "Fresh organic Masala Chai for your everyday ritual.",
        "content_type": "Promotional Email",
        "purpose_card": {
            "goal": "Launch announcement",
            "audience": "Tea drinkers",
            "key_message": "Organic tea",
            "call_to_action": "Order today at kettleandco.example",
            "locked_phrases": ["Masala Chai"],
            "content_type": "Promotional Email",
            "ai_declared": False,
        },
        "ai_declared": False,
    }

    # Reviewer cannot submit drafts -> 403
    reviewer_res = client.post("/api/reviews", headers={"X-Demo-Role": "Reviewer"}, json=payload)
    assert reviewer_res.status_code == 403
    assert "FORBIDDEN" in reviewer_res.json()["detail"]["error"]["code"]

    # Admin cannot submit drafts -> 403
    admin_res = client.post("/api/reviews", headers={"X-Demo-Role": "Admin"}, json=payload)
    assert admin_res.status_code == 403
    assert "FORBIDDEN" in admin_res.json()["detail"]["error"]["code"]

    # Creator can submit drafts -> 201
    creator_res = client.post("/api/reviews", headers={"X-Demo-Role": "Creator"}, json=payload)
    assert creator_res.status_code == 201
    assert "id" in creator_res.json()

    # Brand Manager can submit drafts -> 201
    bm_res = client.post("/api/reviews", headers={"X-Demo-Role": "Brand manager"}, json=payload)
    assert bm_res.status_code == 201
    assert "id" in bm_res.json()
