"""Constants and enumerations for Pramaan.

All status strings, severity levels, size limits, and role definitions are
centralised here to eliminate magic strings and numbers across the system.
"""

from enum import Enum

MAX_CONTENT_CHARS: int = 20_000
MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024  # 5 MB
MAX_COMMENT_CHARS: int = 2_000
MIN_REASON_CHARS: int = 1
MAX_REASON_CHARS: int = 500
DEFAULT_TIMEOUT_SECONDS: float = 10.0


class Role(str, Enum):
    """Demo roles supported in the application."""

    CREATOR = "Creator"
    REVIEWER = "Reviewer"
    BRAND_MANAGER = "Brand manager"
    ADMIN = "Admin"


class Severity(str, Enum):
    """Finding severity levels."""

    BLOCKER = "Blocker"
    MAJOR = "Major"
    MINOR = "Minor"
    INFO = "Info"


class FindingStatus(str, Enum):
    """Evidence status of a finding."""

    SUPPORTED = "Supported"
    CONTRADICTED = "Contradicted"
    UNSUPPORTED = "Unsupported"
    NEEDS_HUMAN_JUDGEMENT = "Needs human judgement"
    NOT_CHECKED = "Not checked"


class CheckMethod(str, Enum):
    """Detection method that surfaced the finding."""

    DETERMINISTIC = "deterministic"
    AI = "ai"
    HYBRID = "hybrid"


class ReviewStatus(str, Enum):
    """Lifecycle workflow state of content under review."""

    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    AI_REVIEWED = "AI-reviewed"
    CHANGES_REQUESTED = "Changes requested"
    REVISED = "Revised"
    IN_HUMAN_REVIEW = "In human review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    EXPORTED = "Exported"


class DecisionAction(str, Enum):
    """Actions that can be taken on a finding."""

    ACCEPT = "accept"
    EDIT = "edit"
    DISMISS = "dismiss"
    ASK_REVIEWER = "ask_reviewer"
    OVERRIDE = "override"


PASS_EXPLANATION_SENTENCE: str = (
    "A pass means only that no issue was detected by the checks performed."
)

CERTIFICATE_LEGAL_NOTICE: str = (
    "Approval records a human decision; it is not a legal compliance certification."
)
