"""Cryptographic security, Argon2id hashing, and JWT session handling."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.config import settings

# Argon2id password hasher with production-grade parameters
hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

COMMON_PASSWORDS = {
    "password", "password123", "1234567890", "qwertyuiop", "admin12345",
    "welcome123", "letmein123", "iloveyou12", "pramaan123", "changeme12"
}


def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, Exception):
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password requirements: minimum 10 chars, not easily guessable."""
    if len(password) < 10:
        return False, "Password must be at least 10 characters long."
    if password.lower() in COMMON_PASSWORDS:
        return False, "Password is too common. Please choose a more complex passphrase."
    if password.isdigit():
        return False, "Password cannot be numbers only."
    if password.isalpha():
        return False, "Password should contain a mix of letters and numbers or symbols."
    return True, "Strong password"


def create_access_token(
    user_id: str,
    email: str,
    workspace_id: str | None = None,
    role: str | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Create short-lived JWT access token (15 mins default)."""
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "workspace_id": workspace_id,
        "role": role,
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "access":
            return None
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def generate_secure_token(length: int = 32) -> str:
    """Generate cryptographically secure URL-safe random string."""
    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    """Compute SHA-256 hash of random tokens (stored at rest)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

