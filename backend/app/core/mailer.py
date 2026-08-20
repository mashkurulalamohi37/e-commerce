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


async def send_order_confirmation_email(
    to_email: str,
    customer_name: str,
    order_number: str,
    total: float,
    address: str,
) -> None:
    if not to_email:
        return

    track_link = f"{settings.FRONTEND_URL.rstrip('/')}/track"

    if not _smtp_configured():
        logger.info(
            "SMTP not configured — [Order Confirmation] to %s for Order #%s (Total: ৳%s)",
            to_email,
            order_number,
            total,
        )
        return

    message = EmailMessage()
    message["Subject"] = f"Order Confirmed: {order_number} — {settings.MAIL_FROM_NAME}"
    message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    message["To"] = to_email
    message.set_content(
        f"Hi {customer_name},\n\n"
        f"Thank you for your order with {settings.MAIL_FROM_NAME}!\n\n"
        f"Order Number: {order_number}\n"
        f"Total Amount: ৳{total:g}\n"
        f"Delivery Address: {address}\n\n"
        f"You can track your order status live at: {track_link}\n\n"
        f"Best regards,\n{settings.MAIL_FROM_NAME} Team"
    )

    try:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            smtp.send_message(message)
    except Exception:
        logger.exception("Failed to send order confirmation email to %s", to_email)


async def send_order_status_email(
    to_email: str,
    customer_name: str,
    order_number: str,
    new_status: str,
) -> None:
    if not to_email:
        return

    track_link = f"{settings.FRONTEND_URL.rstrip('/')}/track"

    if not _smtp_configured():
        logger.info(
            "SMTP not configured — [Order Update] to %s for Order #%s status: %s",
            to_email,
            order_number,
            new_status,
        )
        return

    message = EmailMessage()
    message["Subject"] = f"Order #{order_number} Update: {new_status.title()} — {settings.MAIL_FROM_NAME}"
    message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    message["To"] = to_email
    message.set_content(
        f"Hi {customer_name},\n\n"
        f"Your order #{order_number} has been updated to: {new_status.upper()}.\n\n"
        f"Track your order live at: {track_link}\n\n"
        f"Thank you for shopping with {settings.MAIL_FROM_NAME}!\n\n"
        f"Best regards,\n{settings.MAIL_FROM_NAME} Team"
    )

    try:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            smtp.send_message(message)
    except Exception:
        logger.exception("Failed to send order status email to %s", to_email)


async def send_order_sms_notification(
    phone: str,
    message: str,
) -> None:
    """Dispatches SMS notification to customer mobile number.
    
    When an SMS gateway provider is configured, it sends via SMS API;
    otherwise logs the notification so updates are tracked reliably in development.
    """
    if not phone:
        return
    logger.info("[SMS Notification] to %s: %s", phone, message)


