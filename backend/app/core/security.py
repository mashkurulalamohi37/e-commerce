import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Union

import bcrypt
import jwt

from app.core.config import settings

# bcrypt silently truncates anything past 72 bytes, so two passwords sharing a
# 72-byte prefix would authenticate each other. Rejected at the schema layer
# (see UserCreate.password) and guarded again here.
BCRYPT_MAX_BYTES = 72


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


PASSWORD_RESET_AUDIENCE = "password-reset"
PASSWORD_RESET_TTL_MINUTES = 30


def create_password_reset_token(user_id: Union[str, Any], password_hash: str) -> str:
    """Single-use reset token.

    Single-use without a database table: the current password hash is folded into
    the signature, so the token stops verifying the moment the password changes —
    which includes the reset itself.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "aud": PASSWORD_RESET_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(minutes=PASSWORD_RESET_TTL_MINUTES),
        "pwh": _password_fingerprint(password_hash),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def read_password_reset_token(token: str, password_hash: str) -> str | None:
    """Returns the user id if the token is valid for this exact password hash."""
    try:
        claims = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=PASSWORD_RESET_AUDIENCE,
        )
    except jwt.PyJWTError:
        return None

    if not hmac.compare_digest(
        str(claims.get("pwh", "")), _password_fingerprint(password_hash)
    ):
        return None
    return claims.get("sub")


def peek_token_subject(token: str) -> str | None:
    """Reads `sub` WITHOUT verifying the signature — only to look the user up so
    the real, hash-bound verification can run. Never trust this on its own."""
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
        subject = claims.get("sub")
        return str(subject) if subject else None
    except jwt.PyJWTError:
        return None


def _password_fingerprint(password_hash: str) -> str:
    return hashlib.sha256(f"{settings.SECRET_KEY}:{password_hash}".encode("utf-8")).hexdigest()[:32]


def _encode(password: str) -> bytes:
    raw = password.encode("utf-8")
    if len(raw) > BCRYPT_MAX_BYTES:
        raise ValueError(f"Password must be at most {BCRYPT_MAX_BYTES} bytes")
    return raw


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time check. Returns False rather than raising on a malformed hash."""
    try:
        return bcrypt.checkpw(_encode(plain_password), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(_encode(password), bcrypt.gensalt()).decode("utf-8")
