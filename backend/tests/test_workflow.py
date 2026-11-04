"""Workflow integration test: End-to-end review loop, revision re-check, and approval certificate."""

import pytest
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    return TestClient(app)


def test_core_review_workflow_end_to_end(client):
    """Execute the full core loop: submit -> view findings -> accept suggestion -> new version -> approve -> certificate."""
    # Step 1: Submit draft with banned term
    create_res = client.post(
        "/api/reviews",
        headers={"X-Demo-Role": "Creator"},
        json={
            "brand_kit_id": "kettle-and-co",
            "content": "Taste our cheap tea and enjoy genuine Masala Chai.",
            "content_type": "Promotional Copy",
            "purpose_card": {
                "goal": "Introduce everyday value blend",
                "audience": "Tea drinkers",
                "key_message": "Wholesome tea at fair prices",
                "call_to_action": "Order today on our store",
                "locked_phrases": ["Masala Chai"],
                "content_type": "Promotional Copy",
                "ai_declared": False,
            },
            "ai_declared": False,
        },
    )
    assert create_res.status_code == 201
    data = create_res.json()
    review_id = data["id"]
    assert data["current_version"] == 1
    assert len(data["findings"]) >= 1

    # Find the banned term finding
    term_finding = [f for f in data["findings"] if f["rule_id"] == "TERM-001"][0]
    finding_id = term_finding["id"]
    assert term_finding["suggestion"] == "accessible value"

    # Step 2: Creator accepts the suggestion
    act_res = client.post(
        f"/api/reviews/{review_id}/findings/{finding_id}/act",
        headers={"X-Demo-Role": "Creator"},
        json={"action": "accept"},
    )
    assert act_res.status_code == 200
    v2_data = act_res.json()

    # Step 3: Verify new version created, diff produced, and banned term resolved!
    assert v2_data["current_version"] == 2
    assert len(v2_data["versions"]) == 2
    v2_content = v2_data["versions"][1]["content"]
    assert "accessible value" in v2_content
    assert "cheap" not in v2_content

    # In version 2, TERM-001 should be gone!
    v2_term_findings = [f for f in v2_data["findings"] if f["rule_id"] == "TERM-001"]
    assert len(v2_term_findings) == 0

    # Step 4: Brand Manager approves the review
    approve_res = client.post(
        f"/api/reviews/{review_id}/approval",
        headers={"X-Demo-Role": "Brand manager"},
        json={"outcome": "Approved", "reason": "All brand compliance checks satisfied for launch."},
    )
    assert approve_res.status_code == 200
    final_data = approve_res.json()
    assert final_data["status"] == "Approved"

    # Step 5: Retrieve and verify downloadable Approval Certificate
    cert_res = client.get(f"/api/reviews/{review_id}/certificate")
    assert cert_res.status_code == 200
    assert "text/html" in cert_res.headers["content-type"]
    assert "Pramaan Brand Governance Certificate" in cert_res.text
    assert (
        "Approval records a human decision; it is not a legal compliance certification."
        in cert_res.text
    )
    assert "Tamper-Evident Verification Hash" in cert_res.text
