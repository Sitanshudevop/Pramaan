"""Pydantic v2 schemas for request and response validation.

All schemas enforce extra='forbid' per Section 5.1 of SECURITY.md and
strictly type all workflow data and finding structures.
"""

from datetime import datetime
from typing import Any

from app.constants import (
    MAX_COMMENT_CHARS,
    MAX_CONTENT_CHARS,
    MAX_REASON_CHARS,
    MIN_REASON_CHARS,
    CheckMethod,
    DecisionAction,
    FindingStatus,
    ReviewStatus,
    Role,
    Severity,
)
from pydantic import BaseModel, ConfigDict, Field


class StrictBaseModel(BaseModel):
    """Base schema enforcing extra='forbid' across all API payloads."""

    model_config = ConfigDict(extra="forbid")


# --- Purpose Card & Review Submission ---


class PurposeCard(StrictBaseModel):
    """Purpose card framing creator intent and must-keep constraints."""

    goal: str = Field(..., min_length=3, max_length=500, description="Goal of the content piece")
    audience: str = Field(
        ..., min_length=3, max_length=500, description="Target reader or customer audience"
    )
    key_message: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="Single primary message that must be conveyed",
    )
    call_to_action: str = Field(
        ..., min_length=2, max_length=300, description="Desired action from the reader"
    )
    locked_phrases: list[str] = Field(
        default_factory=list, description="Must-keep phrases that suggestions cannot alter"
    )
    content_type: str = Field(
        default="Promotional Copy",
        max_length=100,
        description="Format e.g. Promotional Email, Landing Page",
    )
    ai_declared: bool = Field(
        default=False, description="Whether generative AI was used to draft this content"
    )


class CreateReviewRequest(StrictBaseModel):
    """Request payload to initiate a new pre-publication review."""

    brand_kit_id: str = Field(..., min_length=1, max_length=64)
    content: str = Field(
        ...,
        min_length=1,
        max_length=MAX_CONTENT_CHARS,
        description="Content text max 20,000 characters",
    )
    content_type: str = Field(default="Promotional Copy", max_length=100)
    purpose_card: PurposeCard
    ai_declared: bool = Field(default=False)


class ReviseReviewRequest(StrictBaseModel):
    """Request payload when accepting or manually editing content to spawn a new version."""

    content: str = Field(..., min_length=1, max_length=MAX_CONTENT_CHARS)
    reason: str | None = Field(default=None, max_length=MAX_REASON_CHARS)


# --- Finding, Decision, and Re-check ---


class SuggestionCheck(StrictBaseModel):
    """Verification results performed on a suggested correction."""

    rule_rechecked: bool = Field(
        default=True, description="Whether the suggestion was re-evaluated against the rule"
    )
    rule_passed: bool = Field(
        default=True, description="Whether the suggestion resolves the violation"
    )
    purpose_preserved: bool = Field(
        default=True, description="Whether locked phrases and CTA survive in the suggestion"
    )
    note: str | None = None


class DecisionRecord(StrictBaseModel):
    """Recorded human decision on a finding."""

    id: str
    finding_id: str
    actor_role: Role
    action: DecisionAction
    reason: str | None = None
    created_at: datetime


class Finding(StrictBaseModel):
    """Evidence-backed finding record."""

    id: str
    review_id: str
    version: int
    category: str
    severity: Severity
    status: FindingStatus
    method: CheckMethod
    confidence: float = Field(ge=0.0, le=1.0)
    excerpt: str
    start: int
    end: int
    rule_id: str | None = None
    fact_id: str | None = None
    source_title: str
    source_version: str = "1.0"
    reason: str
    suggestion: str | None = None
    suggestion_check: SuggestionCheck = Field(default_factory=SuggestionCheck)
    decision: DecisionRecord | None = None
    created_at: datetime


class ActOnFindingRequest(StrictBaseModel):
    """Action payload for accepting, editing, dismissing, or asking reviewer."""

    action: DecisionAction
    edited_suggestion: str | None = Field(default=None, max_length=MAX_CONTENT_CHARS)
    reason: str | None = Field(
        default=None, min_length=MIN_REASON_CHARS, max_length=MAX_REASON_CHARS
    )


class OverrideFindingRequest(StrictBaseModel):
    """Reviewer/Manager override payload with mandatory reason."""

    reason: str = Field(
        ...,
        min_length=MIN_REASON_CHARS,
        max_length=MAX_REASON_CHARS,
        description="Mandatory justification for override",
    )


# --- Comments & Approvals ---


class AddCommentRequest(StrictBaseModel):
    """Message comment on a review discussion thread."""

    message: str = Field(..., min_length=1, max_length=MAX_COMMENT_CHARS)


class Comment(StrictBaseModel):
    """Comment response."""

    id: str
    review_id: str
    actor_role: Role
    message: str
    created_at: datetime


class ApprovalDecisionRequest(StrictBaseModel):
    """Approval or change request payload."""

    outcome: str = Field(..., description="'Approved', 'Rejected', or 'Changes requested'")
    reason: str | None = Field(default=None, max_length=MAX_REASON_CHARS)


class Approval(StrictBaseModel):
    """Approval response."""

    id: str
    review_id: str
    role: Role
    outcome: str
    reason: str | None = None
    created_at: datetime


# --- Version History & Full Review Response ---


class ReviewVersionSummary(StrictBaseModel):
    """Version snapshot metadata."""

    id: str
    version: int
    content: str
    diff_from_previous: str | None = None
    created_at: datetime


class ReviewResponse(StrictBaseModel):
    """Complete review record with active findings, history, and status."""

    id: str
    kit_id: str
    status: ReviewStatus
    content_type: str
    purpose_card: PurposeCard
    ai_declared: bool
    current_version: int
    created_by_role: Role
    created_at: datetime
    updated_at: datetime
    versions: list[ReviewVersionSummary]
    findings: list[Finding]
    comments: list[Comment]
    approvals: list[Approval]
    pass_notice: str = Field(
        default="A pass means only that no issue was detected by the checks performed."
    )


# --- Brand Hub & Rules ---


class RuleItem(StrictBaseModel):
    """Brand rule definition."""

    id: str
    kit_id: str
    category: str
    title: str
    text: str
    banned_terms: list[str] = Field(default_factory=list)
    severity: Severity
    version: str
    status: str
    effective_from: str
    owner: str
    source: str


class FactItem(StrictBaseModel):
    """Facts register entry."""

    id: str
    kit_id: str
    subject: str
    value: str
    unit: str
    valid_from: str
    valid_to: str
    permitted_wording: str
    owner: str
    source: str
    status: str


class BrandKitSummary(StrictBaseModel):
    """Brand kit summary including rules and facts register."""

    id: str
    name: str
    tagline: str
    industry: str
    description: str
    voice_tone: str
    target_reading_level: int
    primary_color: str
    rules: list[RuleItem]
    facts: list[FactItem]


class UpdateRuleRequest(StrictBaseModel):
    """Brand manager rule update request creating a new rule version."""

    title: str | None = Field(default=None, max_length=256)
    text: str | None = Field(default=None, max_length=2000)
    severity: Severity | None = None
    banned_terms: list[str] | None = None
    reason: str = Field(..., min_length=MIN_REASON_CHARS, max_length=MAX_REASON_CHARS)


# --- Audit & Disclosure Ledger ---


class AuditLogEntry(StrictBaseModel):
    """Append-only audit record."""

    seq: int
    created_at: datetime
    actor_role: Role
    action: str
    entity: str
    entity_id: str
    detail: dict[str, Any]


class DisclosureLedgerEntry(StrictBaseModel):
    """AI disclosure entry."""

    id: str
    review_id: str
    provider: str
    model: str
    data_class: str
    pii_redacted: bool
    token_count: int
    created_at: datetime


# --- Insights & Stats ---


class RuleViolationStat(StrictBaseModel):
    """Aggregation of rule violation frequency."""

    rule_id: str
    rule_name: str
    category: str
    severity: Severity
    count: int
    simulated: bool = False


class RuleOverrideStat(StrictBaseModel):
    """Aggregation of rule override counts and reasons."""

    rule_id: str
    rule_name: str
    category: str
    override_count: int
    reasons: list[str]
    simulated: bool = False


class AmbiguousRuleStat(StrictBaseModel):
    """Rule ambiguity index calculated from override ratio and reviewer variance."""

    rule_id: str
    rule_name: str
    category: str
    violation_count: int
    override_count: int
    ambiguity_score: float = Field(
        ge=0.0, le=1.0, description="0 (crystal clear) to 1 (highly ambiguous)"
    )
    recommendation: str
    simulated: bool = False


class InsightsResponse(StrictBaseModel):
    """Insights summary."""

    total_events: int
    top_repeated_violations: list[RuleViolationStat]
    most_overridden_rules: list[RuleOverrideStat]
    unclear_rules: list[AmbiguousRuleStat]
    simulated_notice: str = (
        "Seed insights are populated with simulated review events for demonstration."
    )
