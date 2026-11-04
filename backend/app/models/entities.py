"""SQLAlchemy entity models for Pramaan."""

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
)
from sqlalchemy.orm import relationship


class BrandKitModel(Base):
    """Brand kit containing guidelines, voice, rules and facts."""

    __tablename__ = "brand_kits"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    tagline = Column(String(256), nullable=False)
    industry = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    voice_tone = Column(Text, nullable=False)
    target_reading_level = Column(Integer, default=8, nullable=False)
    primary_color = Column(String(32), default="#1F7A5C", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    rules = relationship("RuleModel", back_populates="brand_kit", cascade="all, delete-orphan")
    facts = relationship("FactModel", back_populates="brand_kit", cascade="all, delete-orphan")
    reviews = relationship("ReviewModel", back_populates="brand_kit", cascade="all, delete-orphan")


class RuleModel(Base):
    """Brand rule or guideline specification."""

    __tablename__ = "rules"

    id = Column(String(64), primary_key=True)
    kit_id = Column(String(64), ForeignKey("brand_kits.id"), nullable=False)
    category = Column(String(64), nullable=False)
    title = Column(String(256), nullable=False)
    text = Column(Text, nullable=False)
    banned_terms_json = Column(Text, default="[]", nullable=False)
    severity = Column(String(32), nullable=False)  # Blocker, Major, Minor, Info
    version = Column(String(32), default="1.0", nullable=False)
    status = Column(String(32), default="active", nullable=False)  # draft, active, superseded
    effective_from = Column(String(32), nullable=False)
    owner = Column(String(128), nullable=False)
    source = Column(String(256), nullable=False)

    brand_kit = relationship("BrandKitModel", back_populates="rules")

    @property
    def banned_terms(self) -> list[str]:
        """Deserialize banned terms JSON."""
        try:
            return json.loads(self.banned_terms_json or "[]")
        except Exception:
            return []


class FactModel(Base):
    """Approved factual claims in the facts register."""

    __tablename__ = "facts"

    id = Column(String(64), primary_key=True)
    kit_id = Column(String(64), ForeignKey("brand_kits.id"), nullable=False)
    subject = Column(String(256), nullable=False)
    value = Column(String(256), nullable=False)
    unit = Column(String(64), nullable=False)
    valid_from = Column(String(32), nullable=False)
    valid_to = Column(String(32), nullable=False)
    permitted_wording = Column(Text, nullable=False)
    owner = Column(String(128), nullable=False)
    source = Column(String(256), nullable=False)
    status = Column(String(32), default="active", nullable=False)  # active, superseded

    brand_kit = relationship("BrandKitModel", back_populates="facts")


class ReviewModel(Base):
    """Pre-publication content submission under review."""

    __tablename__ = "reviews"

    id = Column(String(64), primary_key=True)
    kit_id = Column(String(64), ForeignKey("brand_kits.id"), nullable=False)
    status = Column(String(64), default="Draft", nullable=False)
    content_type = Column(String(64), default="Promotional Copy", nullable=False)
    purpose_card_json = Column(Text, nullable=False)
    ai_declared = Column(Boolean, default=False, nullable=False)
    current_version = Column(Integer, default=1, nullable=False)
    created_by_role = Column(String(32), default="Creator", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

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


class ReviewVersionModel(Base):
    """Historical version snapshot of review text."""

    __tablename__ = "review_versions"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey("reviews.id"), nullable=False)
    version = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    diff_from_previous = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    review = relationship("ReviewModel", back_populates="versions")


class FindingModel(Base):
    """Evidence-backed brand finding with purpose-preserving suggestion."""

    __tablename__ = "findings"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey("reviews.id"), nullable=False)
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
    """Collaborative discussion message on a review."""

    __tablename__ = "comments"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey("reviews.id"), nullable=False)
    actor_role = Column(String(32), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    review = relationship("ReviewModel", back_populates="comments")


class ApprovalModel(Base):
    """Workflow approval decision record."""

    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), ForeignKey("reviews.id"), nullable=False)
    role = Column(String(32), nullable=False)
    outcome = Column(String(32), nullable=False)  # Approved, Rejected, Changes requested
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    review = relationship("ReviewModel", back_populates="approvals")


class AuditLogModel(Base):
    """Append-only audit ledger. No UPDATE or DELETE is ever executed here."""

    __tablename__ = "audit_log"

    seq = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    actor_role = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False)
    entity = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    detail_json = Column(Text, default="{}", nullable=False)  # No raw content stored


class DisclosureLedgerModel(Base):
    """Immutable ledger of AI processing and confidential data dispatch."""

    __tablename__ = "disclosure_ledger"

    id = Column(String(64), primary_key=True)
    review_id = Column(String(64), nullable=False)
    provider = Column(String(64), nullable=False)
    model = Column(String(64), nullable=False)
    data_class = Column(String(64), default="Confidential (Passage)", nullable=False)
    pii_redacted = Column(Boolean, default=True, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class SimulatedEventModel(Base):
    """Pre-seeded simulated review events for brand insights."""

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
