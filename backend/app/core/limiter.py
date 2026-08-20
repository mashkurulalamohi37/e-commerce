"""Request rate limiting.

`slowapi` was already pinned in requirements.txt and imported nowhere, so every
abusable endpoint was wide open: 15 failed logins in 5.5 seconds were all
answered normally, and ten password-reset requests for one address all sent
mail. Limits are declared here so the thresholds sit in one place.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Guessing a password, and asking us to email someone repeatedly.
CREDENTIAL_LIMIT = "5/minute"
# Account creation, which costs a bcrypt hash and a row.
SIGNUP_LIMIT = "10/hour"
# Customer-generated content that appears on the storefront immediately.
CONTENT_LIMIT = "10/hour"


def _client_key(request) -> str:
    """Identify the caller for limiting purposes.

    Only trusts proxy headers (X-Real-IP / X-Forwarded-For) if the immediate connecting
    client host matches trusted proxy addresses (e.g. reverse proxy / load balancer).
    This prevents arbitrary header spoofing attacks.
    """
    direct_ip = getattr(getattr(request, "client", None), "host", None) or get_remote_address(request)
    
    # Only inspect forwarding headers if connecting directly from a trusted proxy
    if direct_ip in settings.TRUSTED_PROXIES:
        real_ip = request.headers.get("x-real-ip")
        if real_ip and real_ip.strip():
            return real_ip.strip()
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            parts = [p.strip() for p in forwarded.split(",") if p.strip()]
            if parts:
                return parts[0]  # First IP is the original client IP when proxy is trusted
    return direct_ip


limiter = Limiter(
    key_func=_client_key,
    # In-process counters. Fine for a single worker; point this at Redis via
    # storage_uri before running more than one.
    default_limits=[],
    enabled=settings.RATE_LIMIT_ENABLED,
)
