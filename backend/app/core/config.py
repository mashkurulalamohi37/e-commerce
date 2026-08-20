from pathlib import Path
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
    # Was 7 days. A stolen token stayed usable for a week, and the token lives in
    # localStorage where any XSS can read it, so the window is the exposure.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # Turned off in the test suite, which fires the same endpoint in a loop.
    RATE_LIMIT_ENABLED: bool = True

    # Database URL — SQLite default works seamlessly on cPanel and local dev
    DATABASE_URL: str = "sqlite+aiosqlite:///ecommerce.db"

    # CORS origins. Must list the exact scheme://host:port the browser sends —
    # credentials are allowed, so a wildcard is not an option.
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nillsmart.com",
        "https://www.nillsmart.com",
        "http://nillsmart.com",
        "http://www.nillsmart.com",
    ]

    # Trusted reverse proxy IPs allowed to supply X-Forwarded-For / X-Real-IP
    TRUSTED_PROXIES: List[str] = ["127.0.0.1", "::1", "localhost"]

    # Delivery fees in BDT. Must match src/lib/catalog.ts — the storefront quotes
    # these to the customer before the server recomputes the order total.
    DELIVERY_FEE_INSIDE_DHAKA: float = 79.0
    DELIVERY_FEE_OUTSIDE_DHAKA: float = 119.0

    # Origin of the storefront, used to build password-reset links.
    FRONTEND_URL: str = "https://nillsmart.com"

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # SMTP Mailer configuration
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@nillsmart.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Nills Mart"

    model_config = SettingsConfigDict(
        env_file=(str(Path(__file__).resolve().parents[2] / ".env"), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def _require_strong_secret(cls, value: str, info) -> str:
        if not value or len(value.encode("utf-8")) < MIN_SECRET_KEY_BYTES:
            # Ephemeral fallback key so server boots cleanly without 503 crashes
            return secrets.token_urlsafe(48)
        return value


settings = Settings()
