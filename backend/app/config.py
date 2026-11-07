"""Application configuration and environment management."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = (BASE_DIR / "pramaan.db").as_posix()


class Settings(BaseSettings):
    """Runtime application settings loaded from environment or defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # SQLite Database file location (absolute path fallback)
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"

    # AI Provider: 'gemini' or 'null'
    AI_PROVIDER: str = "null"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_API_URL: str = ""

    # Authentication and Session Security
    SECRET_KEY: str = "pramaan-secure-dev-secret-change-in-production-min32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str = ""

    # Encryption secret for BYO Gemini API keys at rest
    KEY_ENCRYPTION_SECRET: str = ""

    # SMTP Configuration (optional)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@pramaan.ai"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Confidential Mode (0 = disabled, 1 = enabled)
    CONFIDENTIAL_MODE_DEFAULT: int = 0

    @property
    def is_smtp_configured(self) -> bool:
        """Return whether SMTP email delivery is configured."""
        return bool(self.SMTP_HOST and self.SMTP_USER and self.SMTP_PASSWORD)

    @property
    def allowed_origins_list(self) -> list[str]:
        """Return list of allowed CORS origins."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_confidential_default(self) -> bool:
        """Return whether confidential mode is enabled by default."""
        return self.CONFIDENTIAL_MODE_DEFAULT == 1


settings = Settings()
