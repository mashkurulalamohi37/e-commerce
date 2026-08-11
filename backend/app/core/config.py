import secrets
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# HS256 signs with the raw key; RFC 7518 §3.2 requires at least 256 bits.
MIN_SECRET_KEY_BYTES = 32


class Settings(BaseSettings):
    PROJECT_NAME: str = "E-Commerce FastAPI Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # No hardcoded fallback. A committed default meant that if the env var went
    # missing in production, every JWT was forgeable by anyone who had read the
    # repository. Outside development this must be supplied and is verified below.
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # PostgreSQL Database URL
    # Format: postgresql+asyncpg://user:password@host:port/dbname
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_db"

    # CORS origins. Must list the exact scheme://host:port the browser sends —
    # credentials are allowed, so a wildcard is not an option.
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Delivery fees in BDT. Must match src/lib/catalog.ts — the storefront quotes
    # these to the customer before the server recomputes the order total.
    DELIVERY_FEE_INSIDE_DHAKA: float = 79.0
    DELIVERY_FEE_OUTSIDE_DHAKA: float = 119.0

    # Origin of the storefront, used to build password-reset links.
    FRONTEND_URL: str = "http://localhost:5173"

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # SMTP Mailer configuration
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@example.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Nills Mart"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def _require_strong_secret(cls, value: str, info) -> str:
        environment = (info.data or {}).get("ENVIRONMENT", "development")

        if not value:
            if environment != "development":
                raise ValueError(
                    "SECRET_KEY must be set outside development. "
                    "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
                )
            # Ephemeral per-process key for local work: tokens stop working on
            # restart, which is the correct nudge to set a real one.
            return secrets.token_urlsafe(48)

        if len(value.encode("utf-8")) < MIN_SECRET_KEY_BYTES:
            raise ValueError(
                f"SECRET_KEY must be at least {MIN_SECRET_KEY_BYTES} bytes for {'HS256'}. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return value


settings = Settings()
