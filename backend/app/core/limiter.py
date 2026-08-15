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

    Behind a proxy the socket address is the proxy, so prefer the first hop in
    X-Forwarded-For when one is present. This is only as trustworthy as the
    proxy in front of it — with no proxy, a client can set the header freely,
    so it is used only outside development where a proxy is expected.
    """
    if settings.ENVIRONMENT != "development":
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(
    key_func=_client_key,
    # In-process counters. Fine for a single worker; point this at Redis via
    # storage_uri before running more than one.
    default_limits=[],
    enabled=settings.RATE_LIMIT_ENABLED,
)
