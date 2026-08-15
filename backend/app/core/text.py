"""Validation helpers for free text that is stored and later shown to a customer.

React escapes everything it renders, so a stored `<script>` never executed in
the storefront. It would execute the first time any of this text reached a
consumer that does not escape — a CSV export opened in a spreadsheet, an SMS
template, a transactional email, a PDF invoice. Refusing markup at the point of
storage keeps that from depending on every future consumer getting it right.

Refusing rather than stripping is deliberate: silently rewriting someone's
review changes what they said, and a reviewer who typed an angle bracket
deserves an error they can act on rather than mangled text.
"""

import re
import unicodedata
from typing import Annotated

from pydantic import AfterValidator, StringConstraints

# The start of anything an HTML parser treats as markup: an opening or closing
# tag, a comment, a doctype, or a processing instruction. A bare "<" followed by
# a space or a digit is not markup, so "SPF < 50" and "under < 500 BDT" still
# submit cleanly.
_MARKUP = re.compile(r"<\s*[a-zA-Z/!?]")

# Control characters (keeping tab and newline), zero-width characters, and the
# bidi overrides used to disguise one string as another.
_INVISIBLE = re.compile(
    "[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f"
    "​-‏"  # zero-width space through right-to-left mark
    "‪-‮"  # bidi embedding and override
    "⁦-⁩"  # bidi isolates
    "﻿]"  # zero-width no-break space
)


def strip_invisible(value: str) -> str:
    """Normalise to NFC and drop characters that render as nothing."""
    return _INVISIBLE.sub("", unicodedata.normalize("NFC", value))


def no_markup(value: str) -> str:
    """Reject text containing anything that reads as an HTML tag."""
    cleaned = strip_invisible(value).strip()
    if _MARKUP.search(cleaned):
        raise ValueError("HTML tags are not allowed here — please write plain text.")
    return cleaned


def _slug(value: str) -> str:
    cleaned = strip_invisible(value).strip().lower()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", cleaned):
        raise ValueError(
            "Use lowercase letters, numbers and single hyphens only, e.g. 'skin-care'."
        )
    return cleaned


def _promo_code(value: str) -> str:
    cleaned = strip_invisible(value).strip().upper()
    if not re.fullmatch(r"[A-Z0-9][A-Z0-9_-]{1,31}", cleaned):
        raise ValueError(
            "Promo codes are 2–32 characters: letters, numbers, hyphen or underscore."
        )
    return cleaned


def _relative_or_web_url(value: str) -> str:
    """Allow a site-relative path or an http(s) URL. Blocks javascript: and data:."""
    cleaned = strip_invisible(value).strip()
    if cleaned.startswith("/") and not cleaned.startswith("//"):
        return cleaned
    if re.match(r"https?://[^\s/$.?#].[^\s]*$", cleaned, re.IGNORECASE):
        return cleaned
    raise ValueError(
        "Enter a path starting with '/' or a full http(s):// address."
    )


# Free text shown to customers: no markup, no invisible characters, trimmed.
SafeText = Annotated[str, AfterValidator(no_markup)]

# A URL-safe identifier, e.g. a category or brand slug.
Slug = Annotated[str, StringConstraints(max_length=255), AfterValidator(_slug)]

# A coupon code. Stored and compared upper-case.
PromoCode = Annotated[str, StringConstraints(max_length=50), AfterValidator(_promo_code)]

# A link target for a banner or tile.
LinkTarget = Annotated[
    str, StringConstraints(max_length=500), AfterValidator(_relative_or_web_url)
]

# Bangladeshi mobile number, the same rule the checkout form applies.
BdPhone = Annotated[
    str, StringConstraints(strip_whitespace=True, pattern=r"^01[3-9]\d{8}$")
]
