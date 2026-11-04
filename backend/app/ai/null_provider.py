"""Offline Null AI Provider for confidential mode or unconfigured environments."""

from typing import Any

from app.ai.provider import AIProvider, AIProviderResult
from app.schemas.schemas import PurposeCard


class NullProvider(AIProvider):
    """Fallback provider that returns zero external findings and engages 100% deterministic operation."""

    def __init__(self, reason: str = "Confidential Mode active or GEMINI_API_KEY unset"):
        self.reason = reason

    async def evaluate_content(
        self,
        passage: str,
        retrieved_rules: list[dict[str, Any]],
        retrieved_facts: list[dict[str, Any]],
        purpose_card: PurposeCard,
    ) -> AIProviderResult:
        return AIProviderResult(
            findings=[],
            model="offline-deterministic",
            provider_name="NullProvider",
            tokens_used=0,
            duration_ms=0.0,
            fallback_used=True,
            notice=f"AI layer unavailable ({self.reason}); showing rule-based findings.",
        )
