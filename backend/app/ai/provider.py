"""Abstract AI Provider interface."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from app.schemas.schemas import PurposeCard


@dataclass
class AIProviderResult:
    """Standardized response from an AI provider execution."""

    findings: list[dict[str, Any]]
    model: str
    provider_name: str
    tokens_used: int
    duration_ms: float
    fallback_used: bool = False
    notice: str = ""


class AIProvider(ABC):
    """Abstract interface isolating external AI models from workflow logic."""

    @abstractmethod
    async def evaluate_content(
        self,
        passage: str,
        retrieved_rules: list[dict[str, Any]],
        retrieved_facts: list[dict[str, Any]],
        purpose_card: PurposeCard,
    ) -> AIProviderResult:
        """Evaluate content passage against retrieved active rules and facts."""
        pass

