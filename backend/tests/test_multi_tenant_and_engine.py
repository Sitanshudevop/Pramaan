"""Multi-tenant isolation, Argon2id authentication, and data-driven engine verification tests."""

from datetime import UTC, datetime
from app.auth.security import hash_password, validate_password_strength, verify_password
from app.checks.context import CheckContext
from app.checks.runner import run_deterministic_checks
from app.constants import Severity
from app.database import get_db
from app.main import app
from app.models.entities import BrandKitModel, MembershipModel, RuleModel, UserModel, WorkspaceModel
from app.schemas.schemas import PurposeCard
from fastapi.testclient import TestClient
import pytest


client = TestClient(app)


def test_argon2id_password_hashing():
    """Verify password hashing with Argon2id and complexity validation."""
    pwd = "SecurePassphrase2026!"
    hashed = hash_password(pwd)
    assert hashed.startswith("$argon2id$")
    assert verify_password(pwd, hashed)
    assert not verify_password("WrongPassword123!", hashed)

    # Complexity checks
    ok, _ = validate_password_strength("short")
    assert not ok
    ok, _ = validate_password_strength("1234567890123")
    assert not ok
    ok, _ = validate_password_strength("password123")
    assert not ok
    ok, _ = validate_password_strength("ComplexPassphrase2026#")
    assert ok


def test_tenant_isolation_cross_workspace_protection():
    """Verify User A from Workspace A cannot access or mutate resources of Workspace B (anti-IDOR)."""
    # 1. Sign up User A
    res_a = client.post(
        "/api/auth/signup",
        json={"email": "usera@example.com", "password": "Password12345#A", "full_name": "User Alpha"},
    )
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]
    ws_a_id = res_a.json()["current_workspace"]["id"]

    # 2. Sign up User B
    res_b = client.post(
        "/api/auth/signup",
        json={"email": "userb@example.com", "password": "Password12345#B", "full_name": "User Beta"},
    )
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    ws_b_id = res_b.json()["current_workspace"]["id"]
    assert ws_a_id != ws_b_id

    # 3. User A creates a brand kit in Workspace A
    res_kit_a = client.post(
        "/api/brands",
        headers={"Authorization": f"Bearer {token_a}", "X-Workspace-Id": ws_a_id},
        json={"name": "Alpha Tea Co", "industry": "Food & Beverage", "primary_language": "en-IN"},
    )
    assert res_kit_a.status_code == 201
    kit_a_id = res_kit_a.json()["id"]

    # 4. User B attempts to access Workspace A's brand kit with Workspace B context
    res_idor_get = client.get(
        f"/api/brands/{kit_a_id}",
        headers={"Authorization": f"Bearer {token_b}", "X-Workspace-Id": ws_b_id},
    )
    assert res_idor_get.status_code in (404, 403)

    # 5. User B attempts to access Workspace A by passing X-Workspace-Id of Workspace A (unauthorized cross-tenant)
    res_cross_ws = client.get(
        f"/api/brands/{kit_a_id}",
        headers={"Authorization": f"Bearer {token_b}", "X-Workspace-Id": ws_a_id},
    )
    assert res_cross_ws.status_code == 403
    assert "Access denied" in res_cross_ws.json()["detail"]


def test_generic_data_driven_engine_at_runtime():
    """Verify check engine operates purely on user-defined runtime rules with zero hardcoded brands."""
    # Define a completely custom brand rule at runtime
    custom_rules = [
        {
            "id": "SOLAR-001",
            "category": "Terminology",
            "title": "Banned Fossil Terms",
            "text": "Never refer to competitors as 'dirty fuel'. Use 'legacy energy sources'.",
            "banned_terms": ["dirty fuel"],
            "preferred_replacement": "legacy energy sources",
            "severity": "Major",
            "status": "active",
            "version": "1.0",
        },
        {
            "id": "SOLAR-002",
            "category": "Messaging",
            "title": "Clean Energy Disclaimer",
            "text": "Solar energy output depends on irradiance conditions.",
            "preferred_replacement": "Solar energy output depends on irradiance conditions.",
            "severity": "Blocker",
            "status": "active",
            "version": "1.0",
        },
    ]

    custom_facts = [
        {
            "id": "FACT-SUN-1",
            "subject": "Efficiency Rating",
            "aliases": ["efficiency", "conversion rate"],
            "value": "24",
            "unit": "%",
            "valid_from": "2026-01-01",
            "valid_to": "2027-12-31",
            "permitted_wording": "up to 24% solar conversion efficiency",
            "status": "active",
        }
    ]

    # Draft violating both custom rules and contradicting the fact
    draft_text = "Switch from dirty fuel today! Our panels deliver 35% efficiency for your home."
    ctx = CheckContext(
        text=draft_text,
        rules=custom_rules,
        facts=custom_facts,
        purpose_card=PurposeCard(
            goal="Promote residential solar installation",
            audience="Homeowners in suburbs",
            key_message="Affordable clean rooftop solar energy",
            call_to_action="Get a quote today",
            locked_phrases=["Switch from"],
        ),
        review_id="rev-custom-solar",
        brand_kit_id="solar-power-inc",
        content_type="Landing Page Copy",
    )

    findings = run_deterministic_checks(ctx)
    assert len(findings) >= 2

    # Verify findings cite user's runtime rule IDs
    rule_ids = [f.rule_id for f in findings if f.rule_id]
    assert "SOLAR-001" in rule_ids
    assert "SOLAR-002" in rule_ids

    # Verify no fictional seed brands appear in findings
    for f in findings:
        assert "Masala Chai" not in f.source_title
        assert "Kettle & Co." not in f.source_title
        assert "LedgerLeaf" not in f.source_title


def test_empty_brand_kit_produces_zero_false_findings():
    """Verify an empty brand kit without rules or facts cleanly yields zero policy findings."""
    ctx = CheckContext(
        text="Welcome to our brand new company website. Explore our services.",
        rules=[],
        facts=[],
        purpose_card=PurposeCard(
            goal="Introduce company",
            audience="General public",
            key_message="Reliable quality services",
            call_to_action="Contact us",
            locked_phrases=[],
        ),
        review_id="rev-empty",
        brand_kit_id="brand-new-kit",
    )

    findings = run_deterministic_checks(ctx)
    # No terminology, claims, or facts findings generated
    policy_findings = [f for f in findings if f.category in ("Terminology", "Facts", "Promotional claims", "Messaging")]
    assert len(policy_findings) == 0

