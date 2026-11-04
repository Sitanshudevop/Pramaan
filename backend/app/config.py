"""Application configuration and environment management."""

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # SQLite Database file location
    DATABASE_URL: str = "sqlite:///./backend/pramaan.db"

    # AI Provider: 'gemini' or 'null'
    AI_PROVIDER: str = "null"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_API_URL: str = ""

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Confidential Mode (0 = disabled, 1 = enabled)
    CONFIDENTIAL_MODE_DEFAULT: int = 0

    @property
    def allowed_origins_list(self) -> list[str]:
        """Return list of allowed CORS origins."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_confidential_default(self) -> bool:
        """Return whether confidential mode is enabled by default."""
        return self.CONFIDENTIAL_MODE_DEFAULT == 1


settings = Settings()
