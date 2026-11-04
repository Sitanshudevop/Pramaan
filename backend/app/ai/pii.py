"""PII redaction gateway executed before external AI dispatch."""

import re
from dataclasses import dataclass


@dataclass
class RedactionResult:
    """Outcome of PII sanitization."""

    sanitized_text: str
    redacted_count: int
    has_pii: bool


# Common PII patterns (emails, phone numbers, credit card 16-digit runs, Indian Aadhaar 12-digit runs)
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
PHONE_PATTERN = re.compile(r"(?:\+91[\-\s]?)?[6-9]\d{9}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b")
CARD_PATTERN = re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b")
AADHAAR_PATTERN = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")


def redact_pii(text: str) -> RedactionResult:
    """Redact personal identifiable information with typed placeholders."""
    count = 0

    def email_sub(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        return "[REDACTED_EMAIL]"

    def phone_sub(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        return "[REDACTED_PHONE]"

    def card_sub(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        return "[REDACTED_CARD_NUMBER]"

    def aadhaar_sub(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        return "[REDACTED_ID_NUMBER]"

    # Card must run before Aadhaar to capture 16-digit runs before 12-digit runs
    sanitized = EMAIL_PATTERN.sub(email_sub, text)
    sanitized = PHONE_PATTERN.sub(phone_sub, sanitized)
    sanitized = CARD_PATTERN.sub(card_sub, sanitized)
    sanitized = AADHAAR_PATTERN.sub(aadhaar_sub, sanitized)

    return RedactionResult(
        sanitized_text=sanitized,
        redacted_count=count,
        has_pii=count > 0,
    )
