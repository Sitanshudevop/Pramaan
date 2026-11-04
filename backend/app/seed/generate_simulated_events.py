"""Generate ~120 simulated review events for brand insights with honest simulated flags."""

import json
import random
from datetime import UTC, datetime, timedelta
from pathlib import Path

random.seed(42)

RULE_POOL = [
    {
        "rule_id": "CLAIM-3.1",
        "brand_kit_id": "kettle-and-co",
        "category": "Promotional claims",
        "severity": "Major",
        "rule_name": "Unsubstantiated superlatives",
    },
    {
        "rule_id": "CLAIM-4.2",
        "brand_kit_id": "kettle-and-co",
        "category": "Promotional claims",
        "severity": "Blocker",
        "rule_name": "Medical & health claims",
    },
    {
        "rule_id": "TERM-001",
        "brand_kit_id": "kettle-and-co",
        "category": "Terminology",
        "severity": "Blocker",
        "rule_name": "Banned promotional terms",
    },
    {
        "rule_id": "TERM-002",
        "brand_kit_id": "kettle-and-co",
        "category": "Terminology",
        "severity": "Major",
        "rule_name": "Product name casing",
    },
    {
        "rule_id": "TERM-003",
        "brand_kit_id": "kettle-and-co",
        "category": "Terminology",
        "severity": "Minor",
        "rule_name": "en-IN spelling conventions",
    },
    {
        "rule_id": "MSG-001",
        "brand_kit_id": "kettle-and-co",
        "category": "Messaging",
        "severity": "Major",
        "rule_name": "Mandatory promotional disclaimer",
    },
    {
        "rule_id": "TONE-001",
        "brand_kit_id": "kettle-and-co",
        "category": "Tone and voice",
        "severity": "Minor",
        "rule_name": "Calm readability & shouting",
    },
    {
        "rule_id": "CLAIM-1.1",
        "brand_kit_id": "ledgerleaf",
        "category": "Promotional claims",
        "severity": "Blocker",
        "rule_name": "Unsubstantiated financial promises",
    },
    {
        "rule_id": "CLAIM-1.4",
        "brand_kit_id": "ledgerleaf",
        "category": "Promotional claims",
        "severity": "Major",
        "rule_name": "Mandatory risk disclaimer on yields",
    },
    {
        "rule_id": "MSG-010",
        "brand_kit_id": "ledgerleaf",
        "category": "Messaging",
        "severity": "Blocker",
        "rule_name": "Mandatory market risk disclaimer",
    },
    {
        "rule_id": "TERM-010",
        "brand_kit_id": "ledgerleaf",
        "category": "Terminology",
        "severity": "Major",
        "rule_name": "Deprecated brand names",
    },
]

ACTIONS = [
    ("violation_detected", 0.40),
    ("suggestion_accepted", 0.35),
    ("overridden", 0.15),
    ("dismissed", 0.10),
]

OVERRIDE_REASONS = [
    "Approved exception by Legal Director for annual report",
    "Quote from third-party verified consumer review",
    "Partner co-marketing agreement has approved alternate phrasing",
    "Technical limitation in third-party ad banner character budget",
    "Authorised seasonal campaign variation under CMO guidance",
]

base_time = datetime(2026, 11, 4, 9, 0, 0, tzinfo=UTC)
events = []

for i in range(1, 121):
    days_ago = random.randint(1, 30)
    hours_ago = random.randint(0, 23)
    minutes_ago = random.randint(0, 59)
    event_time = base_time - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)

    rule = random.choice(RULE_POOL)
    r = random.random()
    cumulative = 0.0
    action = "violation_detected"
    for act, weight in ACTIONS:
        cumulative += weight
        if r <= cumulative:
            action = act
            break

    actor_role = "Creator"
    reason = None
    if action == "overridden":
        actor_role = random.choice(["Reviewer", "Brand manager"])
        reason = random.choice(OVERRIDE_REASONS)
    elif action == "suggestion_accepted":
        actor_role = "Creator"
    elif action == "dismissed":
        actor_role = "Reviewer"
        reason = "Contextual nuance satisfies brand intent"

    events.append(
        {
            "id": f"sim-evt-{i:03d}",
            "simulated": True,
            "brand_kit_id": rule["brand_kit_id"],
            "rule_id": rule["rule_id"],
            "rule_name": rule["rule_name"],
            "category": rule["category"],
            "severity": rule["severity"],
            "action": action,
            "actor_role": actor_role,
            "reason": reason,
            "created_at": event_time.isoformat(),
        }
    )

events.sort(key=lambda x: str(x["created_at"]))

output_path = Path(__file__).parent / "simulated_events.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(events, f, indent=2)

print(f"Generated {len(events)} simulated events at {output_path}")
