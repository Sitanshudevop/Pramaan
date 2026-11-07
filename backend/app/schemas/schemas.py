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
    assignee_id: str | None = Field(default=None, max_length=64)


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


class AssignReviewRequest(StrictBaseModel):
    """Assignee payload for claiming or assigning review."""

    assignee_id: str | None = None


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
    creator_id: str | None = None
    assignee_id: str | None = None
    created_at: datetime
    updated_at: datetime
    versions: list[ReviewVersionSummary]
    findings: list[Finding]
    comments: list[Comment]
    approvals: list[Approval]
    is_overdue: bool = False
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


# ---------------------------------------------------------------------------
# Multi-Tenant Real User Accounts & Workspaces Schemas
# ---------------------------------------------------------------------------


class UserSignUpRequest(StrictBaseModel):
    """User registration payload."""

    email: str = Field(..., min_length=5, max_length=256)
    password: str = Field(..., min_length=10, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=128)


class UserSignInRequest(StrictBaseModel):
    """User authentication payload."""

    email: str = Field(..., min_length=5, max_length=256)
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(StrictBaseModel):
    """Public user identity information."""

    id: str
    email: str
    full_name: str
    avatar_url: str | None = None
    avatar_color: str = "#E06D3B"
    notification_language: str = "en-IN"
    notification_preferences_json: str = "{}"
    created_at: datetime


class WorkspaceResponse(StrictBaseModel):
    """Workspace tenant metadata and user's role."""

    id: str
    name: str
    slug: str
    industry: str
    is_demo: bool
    retention_days: int
    ai_enabled: bool
    timezone: str = "Asia/Kolkata"
    date_format: str = "YYYY-MM-DD"
    default_brand_kit_id: str = "kettle-and-co"
    default_spelling: str = "en-IN"
    manager_approval_severity: str = "Blocker"
    require_decision_reason: bool = True
    auto_assign_mode: str = "off"
    sla_hours: int = 48
    confidential_mode: bool = False
    redaction_options_json: str = "{}"
    logo_url: str | None = None
    role: str


class WorkspaceSettingsResponse(StrictBaseModel):
    """Comprehensive workspace governance settings and audit timestamp."""

    id: str
    name: str
    slug: str
    industry: str
    is_demo: bool
    retention_days: int
    ai_enabled: bool
    ai_consent_at: datetime | None = None
    ai_consent_by_id: str | None = None
    ai_consent_by_name: str | None = None
    ai_consent_version: str | None = None
    timezone: str = "Asia/Kolkata"
    date_format: str = "YYYY-MM-DD"
    default_brand_kit_id: str = "kettle-and-co"
    default_spelling: str = "en-IN"
    manager_approval_severity: str = "Blocker"
    require_decision_reason: bool = True
    auto_assign_mode: str = "off"
    sla_hours: int = 48
    confidential_mode: bool = False
    redaction_options_json: str = '{"emails": true, "phones": true, "cards": true}'
    logo_url: str | None = None
    last_changed_by: str | None = None
    last_changed_at: datetime | None = None
    role: str


class AuthSessionResponse(StrictBaseModel):
    """Authentication response payload with token and workspace context."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    current_workspace: WorkspaceResponse
    workspaces: list[WorkspaceResponse] = []


class UpdateProfileRequest(StrictBaseModel):
    """Account profile modification."""

    full_name: str | None = Field(default=None, min_length=2, max_length=128)
    avatar_url: str | None = Field(default=None, max_length=512)
    avatar_color: str | None = Field(default=None, max_length=32)
    notification_language: str | None = Field(default=None, max_length=32)
    current_password: str | None = Field(default=None, max_length=128)
    new_password: str | None = Field(default=None, min_length=10, max_length=128)


class WorkspaceCreateRequest(StrictBaseModel):
    """Workspace creation payload."""

    name: str = Field(..., min_length=2, max_length=128)
    industry: str = Field(default="Technology", max_length=128)


class WorkspaceSettingsUpdateRequest(StrictBaseModel):
    """Update workspace parameters."""

    name: str | None = Field(default=None, min_length=2, max_length=128)
    industry: str | None = Field(default=None, max_length=128)
    retention_days: int | None = Field(default=None, ge=0, le=3650)
    ai_enabled: bool | None = Field(default=None)
    logo_url: str | None = Field(default=None, max_length=512)
    timezone: str | None = Field(default=None, max_length=64)
    date_format: str | None = Field(default=None, max_length=32)
    default_brand_kit_id: str | None = Field(default=None, max_length=64)
    default_spelling: str | None = Field(default=None, max_length=32)
    manager_approval_severity: str | None = Field(default=None, max_length=32)
    require_decision_reason: bool | None = Field(default=None)
    auto_assign_mode: str | None = Field(default=None, max_length=32)
    sla_hours: int | None = Field(default=None, ge=1, le=720)
    confidential_mode: bool | None = Field(default=None)
    redaction_options_json: str | None = Field(default=None)
    ai_consent_version: str | None = Field(default=None, max_length=32)


class ContentTypeResponse(StrictBaseModel):
    """Content format configuration definition."""

    id: str
    workspace_id: str
    name: str
    description: str | None = None
    is_default: bool = False
    requires_manager_approval: bool = False
    default_reviewer_id: str | None = None
    default_reviewer_name: str | None = None
    order_index: int = 0
    is_archived: bool = False
    created_at: datetime


class CreateContentTypeRequest(StrictBaseModel):
    """Create a new content type."""

    name: str = Field(..., min_length=2, max_length=64)
    description: str | None = Field(default=None, max_length=256)
    requires_manager_approval: bool = False
    default_reviewer_id: str | None = None
    order_index: int = 0


class UpdateContentTypeRequest(StrictBaseModel):
    """Update existing content type."""

    name: str | None = Field(default=None, min_length=2, max_length=64)
    description: str | None = Field(default=None, max_length=256)
    requires_manager_approval: bool | None = None
    default_reviewer_id: str | None = None
    order_index: int | None = None
    is_archived: bool | None = None


class RetentionRunResponse(StrictBaseModel):
    """Result of manual retention policy execution."""

    deleted_count: int
    retained_count: int
    retention_days: int
    message: str


class ActiveSessionResponse(StrictBaseModel):
    """Active user session representation."""

    id: str
    device_info: str
    ip_address: str
    created_at: datetime
    last_active_at: datetime
    is_current: bool = False


class NotificationPreferencesUpdateRequest(StrictBaseModel):
    """User notification subscription preferences."""

    assigned: bool = True
    mentions: bool = True
    changes_requested: bool = True
    approved: bool = True
    overdue: bool = True
    quiet_hours_enabled: bool = False
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None


class OnboardingWizardRequest(StrictBaseModel):
    """3-step initial workspace onboarding wizard."""

    workspace_name: str = Field(..., min_length=2, max_length=128)
    industry: str = Field(default="Technology", max_length=128)
    brand_name: str = Field(..., min_length=2, max_length=128)
    primary_language: str = Field(default="en-IN", max_length=32)
    voice_tone: str = Field(default="", max_length=1000)
    target_reading_level: int = Field(default=8, ge=1, le=20)
    brand_colors: list[str] = Field(default_factory=list)
    invite_emails: list[str] = Field(default_factory=list)


class WorkspaceMemberResponse(StrictBaseModel):
    """Workspace team member with assigned role."""

    membership_id: str
    user_id: str
    email: str
    full_name: str
    role: str
    created_at: datetime


class CreateInvitationRequest(StrictBaseModel):
    """Team member invitation issuance."""

    email: str | None = Field(default=None, max_length=256)
    role: str = Field(default="Reviewer", max_length=32)
    max_uses: int = Field(default=1, ge=1, le=100)


class InvitationResponse(StrictBaseModel):
    """Shareable invitation link details."""

    id: str
    token: str
    invite_url: str
    role: str
    email: str | None = None
    expires_at: datetime
    used_count: int
    max_uses: int


# ---------------------------------------------------------------------------
# Dynamic Brand Knowledge Hub CRUD Schemas
# ---------------------------------------------------------------------------


class CreateBrandKitRequest(StrictBaseModel):
    """Create brand kit definition."""

    name: str = Field(..., min_length=2, max_length=128)
    tagline: str = Field(default="", max_length=256)
    industry: str = Field(default="General", max_length=128)
    description: str = Field(default="", max_length=2000)
    voice_tone: str = Field(default="", max_length=2000)
    primary_language: str = Field(default="en-IN", max_length=32)
    target_reading_level: int = Field(default=8, ge=1, le=20)
    primary_color: str = Field(default="#FF8A4C", max_length=32)
    brand_colors: list[str] = Field(default_factory=list)
    default_disclosure: str | None = Field(default=None, max_length=256)


class UpdateBrandKitRequest(StrictBaseModel):
    """Update brand kit definition."""

    name: str | None = Field(default=None, min_length=2, max_length=128)
    tagline: str | None = Field(default=None, max_length=256)
    industry: str | None = Field(default=None, max_length=128)
    description: str | None = Field(default=None, max_length=2000)
    voice_tone: str | None = Field(default=None, max_length=2000)
    primary_language: str | None = Field(default=None, max_length=32)
    target_reading_level: int | None = Field(default=None, ge=1, le=20)
    primary_color: str | None = Field(default=None, max_length=32)
    brand_colors: list[str] | None = None
    default_disclosure: str | None = Field(default=None, max_length=256)
    is_archived: bool | None = None


class CreateRuleRequest(StrictBaseModel):
    """Add a new brand rule."""

    id: str | None = Field(default=None, max_length=64)
    category: str = Field(..., max_length=64)  # Terminology, Messaging, Claims, Tone and voice
    title: str = Field(..., min_length=1, max_length=256)
    text: str = Field(..., min_length=1, max_length=2000)
    banned_terms: list[str] = Field(default_factory=list)
    preferred_replacement: str | None = Field(default=None, max_length=256)
    allow_in_quotes: bool = False
    placement_hint: str = Field(default="anywhere", max_length=32)  # start, end, anywhere
    applies_to_content_types: list[str] = Field(default_factory=list)
    severity: str = Field(default="Major", max_length=32)
    effective_from: str = Field(default="2026-01-01", max_length=32)
    owner: str = Field(default="Brand Team", max_length=128)
    source: str = Field(default="Brand Guidelines", max_length=256)
    reason: str | None = Field(default=None, max_length=MAX_REASON_CHARS)


class UpdateRuleRequest(StrictBaseModel):
    """Update existing brand rule."""

    category: str | None = Field(default=None, max_length=64)
    title: str | None = Field(default=None, min_length=1, max_length=256)
    text: str | None = Field(default=None, min_length=1, max_length=2000)
    banned_terms: list[str] | None = None
    preferred_replacement: str | None = Field(default=None, max_length=256)
    allow_in_quotes: bool | None = None
    placement_hint: str | None = Field(default=None, max_length=32)
    applies_to_content_types: list[str] | None = None
    severity: str | None = Field(default=None, max_length=32)
    status: str | None = Field(default=None, max_length=32)  # draft, active, superseded
    effective_from: str | None = Field(default=None, max_length=32)
    owner: str | None = Field(default=None, max_length=128)
    source: str | None = Field(default=None, max_length=256)
    reason: str | None = Field(default=None, max_length=MAX_REASON_CHARS)


class CreateFactRequest(StrictBaseModel):
    """Add fact to facts register with search keywords."""

    id: str | None = Field(default=None, max_length=64)
    subject: str = Field(..., min_length=1, max_length=256)
    aliases: list[str] = Field(default_factory=list)
    value: str = Field(..., min_length=1, max_length=256)
    unit: str = Field(default="", max_length=64)
    valid_from: str = Field(default="2026-01-01", max_length=32)
    valid_to: str = Field(default="2027-12-31", max_length=32)
    permitted_wording: str = Field(..., min_length=1, max_length=1000)
    owner: str = Field(default="Operations", max_length=128)
    source: str = Field(default="Facts Register", max_length=256)


class UpdateFactRequest(StrictBaseModel):
    """Update fact in register."""

    subject: str | None = Field(default=None, min_length=1, max_length=256)
    aliases: list[str] | None = None
    value: str | None = Field(default=None, min_length=1, max_length=256)
    unit: str | None = Field(default=None, max_length=64)
    valid_from: str | None = Field(default=None, max_length=32)
    valid_to: str | None = Field(default=None, max_length=32)
    permitted_wording: str | None = Field(default=None, min_length=1, max_length=1000)
    owner: str | None = Field(default=None, max_length=128)
    source: str | None = Field(default=None, max_length=256)
    status: str | None = Field(default=None, max_length=32)  # active, superseded


class CreateClaimPatternRequest(StrictBaseModel):
    """Add restricted claim pattern with optional substantiating fact."""

    pattern: str = Field(..., min_length=2, max_length=256)
    category: str = Field(default="Promotional claims", max_length=64)
    severity: str = Field(default="Major", max_length=32)
    substantiating_fact_id: str | None = Field(default=None, max_length=64)
    reason: str = Field(..., min_length=5, max_length=1000)


class CreateGlossaryTermRequest(StrictBaseModel):
    """Add brand term with approved casing and definition."""

    term: str = Field(..., min_length=1, max_length=128)
    preferred_casing: str = Field(..., min_length=1, max_length=128)
    definition: str | None = Field(default=None, max_length=1000)


class NotificationResponse(StrictBaseModel):
    """In-app notification item."""

    id: str
    workspace_id: str
    type: str
    title: str
    body: str
    link: str | None = None
    is_read: bool = False
    created_at: datetime


class BulkImportItem(StrictBaseModel):
    """Single rule or fact to import."""

    type: str = Field(default="rule")
    category: str = Field(default="Terminology")
    title: str = Field(..., min_length=2)
    text: str = Field(..., min_length=2)
    severity: str = Field(default="Major")
    banned_terms: list[str] = Field(default_factory=list)
    preferred_replacement: str | None = None


class BulkImportRulesRequest(StrictBaseModel):
    """Bulk import rules and facts payload."""

    items: list[BulkImportItem]


class GuidelineExtractRequest(StrictBaseModel):
    """Guideline document text for heuristic extraction."""

    content: str = Field(..., min_length=10)
