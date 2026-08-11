"""Outbound email.

When SMTP is not configured the message is logged instead of sent. The reset
token is deliberately never returned in an HTTP response — that would let anyone
reset any account by calling the forgot-password endpoint.
"""

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD and settings.MAIL_SERVER)


def _reset_url(token: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"


async def send_password_reset_email(to_email: str, token: str) -> None:
    link = _reset_url(token)

    if not _smtp_configured():
        # Local development: no SMTP, so print the link for the developer. This
        # only ever reaches the server log, never the HTTP response.
        logger.warning(
            "SMTP not configured — password reset link for %s (valid 30 minutes): %s",
            to_email,
            link,
        )
        return

    message = EmailMessage()
    message["Subject"] = f"Reset your {settings.MAIL_FROM_NAME} password"
    message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    message["To"] = to_email
    message.set_content(
        "We received a request to reset your password.\n\n"
        f"Use this link within 30 minutes:\n{link}\n\n"
        "If you didn't ask for this, you can ignore this email — your password "
        "will stay as it is."
    )

    try:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            smtp.send_message(message)
    except Exception:
        # Never surface delivery failures to the caller: the endpoint must look
        # identical whether or not the address exists.
        logger.exception("Failed to send password reset email to %s", to_email)
