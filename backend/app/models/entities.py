"""SQLAlchemy multi-tenant entity models for Pramaan."""

import json

from app.models.base import Base, get_utc_now
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

# ---------------------------------------------------------------------------
# 1. Accounts, Workspaces, Memberships & Invitations
# ---------------------------------------------------------------------------


class UserModel(Base):
    """Global user identity for real authentication."""

    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    email = Column(String(256), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)  # Argon2id hash
    full_name = Column(String(128), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    avatar_color = Column(String(32), default="#E06D3B", nullable=False)
    notification_language = Column(String(32), default="en-IN", nullable=False)
    notification_preferences_json = Column(
        Text,
        default='{"assigned": true, "mentions": true, "changes_requested": true, "approved": true, "overdue": true}',
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    lockout_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    memberships = relationship(
        "MembershipModel", back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens = relationship(
        "RefreshTokenModel", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshTokenModel(Base):
    """Rotating refresh tokens stored as SHA-256 hashes."""

    __tablename__ = "refresh_tokens"

    id = Column(String(64), primary_key=True)
    user_id = Column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("UserModel", back_populates="refresh_tokens")


class WorkspaceModel(Base):
    """Company or organization tenant boundary."""

    __tablename__ = "workspaces"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    slug = Column(String(128), unique=True, index=True, nullable=False)
    industry = Column(String(128), default="Technology", nullable=False)
    is_demo = Column(Boolean, default=False, index=True, nullable=False)
    retention_days = Column(Integer, default=90, nullable=False)  # 0 = retain indefinitely
    ai_enabled = Column(
        Boolean, default=False, nullable=False
    )  # Off by default for new real tenants
    ai_consent_at = Column(DateTime, nullable=True)
    ai_consent_by_id = Column(String(64), nullable=True)
    ai_consent_version = Column(String(32), nullable=True)
    encrypted_gemini_api_key = Column(String(512), nullable=True)  # Fernet encrypted at rest
    timezone = Column(String(64), default="Asia/Kolkata", nullable=False)
    date_format = Column(String(32), default="YYYY-MM-DD", nullable=False)
    default_brand_kit_id = Column(String(64), default="kettle-and-co", nullable=False)
    default_spelling = Column(String(32), default="en-IN", nullable=False)
    manager_approval_severity = Column(String(32), default="Blocker", nullable=False)
    require_decision_reason = Column(Boolean, default=True, nullable=False)
    auto_assign_mode = Column(
        String(32), default="off", nullable=False
    )  # off, round_robin, by_brand_kit
    sla_hours = Column(Integer, default=48, nullable=False)
    confidential_mode = Column(Boolean, default=False, nullable=False)
    redaction_options_json = Column(
        Text, default='{"emails": true, "phones": true, "cards": true}', nullable=False
    )
    logo_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    memberships = relationship(
        "MembershipModel", back_populates="workspace", cascade="all, delete-orphan"
    )
    brand_kits = relationship(
        "BrandKitModel", back_populates="workspace", cascade="all, delete-orphan"
    )
    reviews = relationship("ReviewModel", back_populates="workspace", cascade="all, delete-orphan")
    invitations = relationship(
        "InvitationModel", back_populates="workspace", cascade="all, delete-orphan"
    )


class MembershipModel(Base):
    """Workspace membership tying user to role (Admin, Brand manager, Reviewer, Creator)."""

    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id", name="uq_workspace_user"),)

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id = Column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role = Column(
        String(32), default="Creator", nullable=False
    )  # Admin, Brand manager, Reviewer, Creator
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    workspace = relationship("WorkspaceModel", back_populates="memberships")
    user = relationship("UserModel", back_populates="memberships")


class InvitationModel(Base):
    """Shareable or email-targeted workspace invitation links."""

    __tablename__ = "invitations"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    email = Column(String(256), nullable=True)
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    role = Column(String(32), default="Reviewer", nullable=False)
    inviter_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    max_uses = Column(Integer, default=1, nullable=False)
    used_count = Column(Integer, default=0, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    workspace = relationship("WorkspaceModel", back_populates="invitations")


# ---------------------------------------------------------------------------
# 2. Brand Knowledge Hub (Kits, Rules, Facts, Claims, Glossary, Types)
# ---------------------------------------------------------------------------


class BrandKitModel(Base):
    """Brand kit containing guidelines, voice, rules, and facts scoped by workspace."""

    __tablename__ = "brand_kits"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        index=True,
        default="ws-demo",
        nullable=False,
    )
    name = Column(String(128), nullable=False)
    tagline = Column(String(256), default="", nullable=False)
    industry = Column(String(128), nullable=False)
    description = Column(Text, default="", nullable=False)
    voice_tone = Column(Text, default="", nullable=False)
    primary_language = Column(String(32), default="en-IN", nullable=False)  # en-IN, en-GB, en-US
    target_reading_level = Column(Integer, default=8, nullable=False)
    primary_color = Column(String(32), default="#1F7A5C", nullable=False)
    brand_colors_json = Column(Text, default="[]", nullable=False)  # Up to 6 hex codes
    logo_url = Column(String(512), nullable=True)
    default_disclosure = Column(String(256), nullable=True)
    is_archived = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    workspace = relationship("WorkspaceModel", back_populates="brand_kits")
    rules = relationship("RuleModel", back_populates="brand_kit", cascade="all, delete-orphan")
    facts = relationship("FactModel", back_populates="brand_kit", cascade="all, delete-orphan")
    reviews = relationship("ReviewModel", back_populates="brand_kit", cascade="all, delete-orphan")


class RuleModel(Base):
    """Brand rule or guideline specification scoped by workspace and kit."""

    __tablename__ = "rules"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        index=True,
        default="ws-demo",
        nullable=False,
    )
    kit_id = Column(String(64), ForeignKey("brand_kits.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(64), nullable=False)  # Terminology, Messaging, Claims, Tone and voice
    title = Column(String(256), nullable=False)
    text = Column(Text, nullable=False)
    banned_terms_json = Column(Text, default="[]", nullable=False)
    preferred_replacement = Column(
        String(256), nullable=True
    )  # Allowed suggestion for banned terms
    allow_in_quotes = Column(Boolean, default=False, nullable=False)
    placement_hint = Column(String(32), default="anywhere", nullable=False)  # start, end, anywhere
    applies_to_content_types_json = Column(
        Text, default="[]", nullable=False
    )  # e.g. ["Social post", "Email"]
    severity = Column(String(32), nullable=False)  # Blocker, Major, Minor, Info
    version = Column(String(32), default="1.0", nullable=False)
    status = Column(String(32), default="active", nullable=False)  # draft, active, superseded
    effective_from = Column(String(32), nullable=False)
    owner = Column(String(128), nullable=False)
    source = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    brand_kit = relationship("BrandKitModel", back_populates="rules")

    @property
    def banned_terms(self) -> list[str]:
        """Deserialize banned terms JSON."""
        try:
            return json.loads(self.banned_terms_json or "[]")
        except Exception:
            return []


class FactModel(Base):
    """Approved factual claims in the facts register with search keywords."""

    __tablename__ = "facts"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        index=True,
        default="ws-demo",
        nullable=False,
    )
    kit_id = Column(String(64), ForeignKey("brand_kits.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(256), nullable=False)
    aliases_json = Column(
        Text, default="[]", nullable=False
    )  # Search keywords/aliases e.g. ["Plus price", "fee", "cost"]
    value = Column(String(256), nullable=False)
    unit = Column(String(64), nullable=False)
    valid_from = Column(String(32), nullable=False)
    valid_to = Column(String(32), nullable=False)
    permitted_wording = Column(Text, nullable=False)
    owner = Column(String(128), nullable=False)
    source = Column(String(256), nullable=False)
    status = Column(String(32), default="active", nullable=False)  # active, superseded
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    brand_kit = relationship("BrandKitModel", back_populates="facts")

    @property
    def aliases(self) -> list[str]:
        """Deserialize search keywords/aliases JSON."""
        try:
            return json.loads(self.aliases_json or "[]")
        except Exception:
            return []


class ClaimPatternModel(Base):
    """Restricted claim pattern linked to optional substantiating fact."""

    __tablename__ = "claim_patterns"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    kit_id = Column(String(64), ForeignKey("brand_kits.id", ondelete="CASCADE"), nullable=False)
    pattern = Column(
        String(256), nullable=False
    )  # Word or regex pattern (e.g. "pesticide-free", "#1")
    category = Column(String(64), default="Promotional claims", nullable=False)
    severity = Column(String(32), default="Major", nullable=False)
    substantiating_fact_id = Column(String(64), nullable=True)  # If null -> status Unsupported
    reason = Column(Text, nullable=False)
    status = Column(String(32), default="active", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class GlossaryTermModel(Base):
    """Approved casing, naming, and terminology definitions."""

    __tablename__ = "glossary_terms"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    kit_id = Column(String(64), ForeignKey("brand_kits.id", ondelete="CASCADE"), nullable=False)
    term = Column(String(128), nullable=False)
    preferred_casing = Column(String(128), nullable=False)
    definition = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class ContentTypeModel(Base):
    """Workspace-configured content types (e.g. Social Post, Email, Landing Page)."""

    __tablename__ = "content_types"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name = Column(String(64), nullable=False)
    description = Column(String(256), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)
    requires_manager_approval = Column(Boolean, default=False, nullable=False)
    default_reviewer_id = Column(String(64), nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


# ---------------------------------------------------------------------------
# 3. Reviews, Versions, Findings & Approvals
# ---------------------------------------------------------------------------


class ReviewModel(Base):
    """Pre-publication content submission under review, scoped by tenant workspace."""

    __tablename__ = "reviews"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        index=True,
        default="ws-demo",
        nullable=False,
    )
    kit_id = Column(String(64), ForeignKey("brand_kits.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(64), default="Draft", nullable=False)
    content_type = Column(String(64), default="Promotional Copy", nullable=False)
    purpose_card_json = Column(Text, nullable=False)
    ai_declared = Column(Boolean, default=False, nullable=False)
    confidential_mode = Column(Boolean, default=False, nullable=False)
    current_version = Column(Integer, default=1, nullable=False)
    creator_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    assignee_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    created_by_role = Column(String(32), default="Creator", nullable=False)
    kit_version_snapshot_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    workspace = relationship("WorkspaceModel", back_populates="reviews")
    brand_kit = relationship("BrandKitModel", back_populates="reviews")
    versions = relationship(
        "ReviewVersionModel",
        back_populates="review",
        cascade="all, delete-orphan",
        order_by="ReviewVersionModel.version",
    )
    findings = relationship("FindingModel", back_populates="review", cascade="all, delete-orphan")
    comments = relationship(
        "CommentModel",
        back_populates="review",
        cascade="all, delete-orphan",
        order_by="CommentModel.created_at",
    )
    approvals = relationship(
        "ApprovalModel",
        back_populates="review",
        cascade="all, delete-orphan",
        order_by="ApprovalModel.created_at",
    )

    @property
    def is_overdue(self) -> bool:
        """Evaluate if review is overdue according to workspace SLA threshold."""
        if self.status in ("Submitted", "In human review", "AI-reviewed"):
            sla = 48
            if self.workspace and hasattr(self.workspace, "sla_hours") and self.workspace.sla_hours:
                sla = self.workspace.sla_hours
            now = get_utc_now()
            created = self.created_at
            if created.tzinfo is not None and now.tzinfo is None:
                created = created.replace(tzinfo=None)
            elif created.tzinfo is None and now.tzinfo is not None:
                now = now.replace(tzinfo=None)
            return (now - created).total_seconds() > sla * 3600
        return False


class ReviewVersionModel(Base):
    """Historical version snapshot of review text."""

    __tablename__ = "review_versions"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    file_name = Column(String(256), nullable=True)
    diff_from_previous = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    review = relationship("ReviewModel", back_populates="versions")


class FindingModel(Base):
    """Evidence-backed brand finding with purpose-preserving suggestion."""

    __tablename__ = "findings"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    category = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)  # Blocker, Major, Minor, Info
    status = Column(
        String(64), nullable=False
    )  # Supported, Contradicted, Unsupported, Needs human judgement, Not checked
    method = Column(String(32), nullable=False)  # deterministic, ai, hybrid
    confidence = Column(Float, default=1.0, nullable=False)
    excerpt = Column(Text, nullable=False)
    start = Column(Integer, nullable=False)
    end = Column(Integer, nullable=False)
    rule_id = Column(String(64), nullable=True)
    fact_id = Column(String(64), nullable=True)
    source_title = Column(String(256), nullable=False)
    source_version = Column(String(32), default="1.0", nullable=False)
    reason = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=True)
    suggestion_check_json = Column(Text, default="{}", nullable=False)
    decision_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    review = relationship("ReviewModel", back_populates="findings")


class DecisionModel(Base):
    """Human decision record on an individual finding."""

    __tablename__ = "decisions"

    id = Column(String(64), primary_key=True)
    finding_id = Column(String(64), nullable=False)
    actor_role = Column(String(32), nullable=False)
    action = Column(String(32), nullable=False)  # accept, edit, dismiss, ask_reviewer, override
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class CommentModel(Base):
    """Collaborative discussion message on a review with mentions."""

    __tablename__ = "comments"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    finding_id = Column(String(64), nullable=True)
    author_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(32), nullable=False)
    message = Column(Text, nullable=False)
    mentions_json = Column(Text, default="[]", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    review = relationship("ReviewModel", back_populates="comments")


class ApprovalModel(Base):
    """Workflow approval decision record."""

    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(32), nullable=False)
    outcome = Column(String(32), nullable=False)  # Approved, Rejected, Changes requested
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    review = relationship("ReviewModel", back_populates="approvals")


# ---------------------------------------------------------------------------
# 4. Audit, Notifications, Disclosure & API Tokens
# ---------------------------------------------------------------------------


class NotificationModel(Base):
    """In-app notifications for review assignment, comments, and approvals."""

    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id = Column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    type = Column(String(64), nullable=False)  # assignment, mention, status_change, invite
    title = Column(String(256), nullable=False)
    body = Column(Text, nullable=False)
    link = Column(String(256), nullable=True)
    is_read = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class AuditLogModel(Base):
    """Append-only audit ledger scoped per tenant workspace."""

    __tablename__ = "audit_log"

    seq = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(64), index=True, default="ws-demo", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    actor_id = Column(String(64), nullable=True)
    actor_role = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False)
    entity = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    detail_json = Column(Text, default="{}", nullable=False)  # No raw draft text stored


class DisclosureLedgerModel(Base):
    """Immutable ledger of AI processing and confidential data dispatch per workspace."""

    __tablename__ = "disclosure_ledger"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(String(64), index=True, default="ws-demo", nullable=False)
    review_id = Column(String(64), nullable=False)
    provider = Column(String(64), nullable=False)
    model = Column(String(64), nullable=False)
    key_type = Column(String(32), default="platform", nullable=False)  # platform vs workspace
    data_class = Column(String(64), default="Confidential (Passage)", nullable=False)
    pii_redacted = Column(Boolean, default=True, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class ApiTokenModel(Base):
    """Hashed programmatic API tokens for CMS/CI pre-publish reviews."""

    __tablename__ = "api_tokens"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(
        String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name = Column(String(128), nullable=False)
    token_prefix = Column(String(16), nullable=False)  # e.g. "prm_live_..."
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    created_by_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class SimulatedEventModel(Base):
    """Simulated review events restricted solely to the Demo workspace."""

    __tablename__ = "simulated_events"

    id = Column(String(64), primary_key=True)
    simulated = Column(Boolean, default=True, nullable=False)
    brand_kit_id = Column(String(64), nullable=False)
    rule_id = Column(String(64), nullable=False)
    rule_name = Column(String(256), nullable=False)
    category = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False)
    actor_role = Column(String(32), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)
