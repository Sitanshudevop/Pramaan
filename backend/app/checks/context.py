"""Data structures and helpers for deterministic rule evaluations."""

from dataclasses import dataclass
from typing import Any

from app.schemas.schemas import PurposeCard


@dataclass(frozen=True)
class CheckContext:
    """Immutable evaluation context provided to pure check functions."""

    text: str
    rules: list[dict[str, Any]]
    facts: list[dict[str, Any]]
    purpose_card: PurposeCard
    review_id: str = "review-eval"
    version: int = 1
    content_type: str = "Promotional Copy"
    ai_declared: bool = False
    brand_kit_id: str = "kettle-and-co"
    target_reading_level: int = 8


def normalize_whitespace(s: str) -> str:
    """Normalize internal multiple spaces and trim."""
    return " ".join(s.split())
