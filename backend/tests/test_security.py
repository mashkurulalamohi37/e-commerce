"""Pure-function checks on hashing and phone normalisation.

Deliberately sync and in their own module — the async suites carry a
module-level asyncio mark that does not apply to these.
"""

import pytest

from app.api.v1.endpoints.orders import _normalise_phone, _same_phone
from app.core import security


class TestPasswordHashing:
    def test_hashes_verify_and_differ_per_call(self):
        first = security.get_password_hash("same-password")
        second = security.get_password_hash("same-password")
        assert first != second  # salted
        assert security.verify_password("same-password", first)
        assert not security.verify_password("other-password", first)

    def test_malformed_hash_returns_false_rather_than_raising(self):
        assert security.verify_password("anything", "not-a-bcrypt-hash") is False


class TestPhoneNormalisation:
    @pytest.mark.parametrize(
        "value",
        ["01712345678", "+8801712345678", "8801712345678", "01712-345678", "+880 1712 345678"],
    )
    def test_bd_formats_reduce_to_the_same_national_number(self, value):
        """The trunk 0 and the 880 country code both have to come off."""
        assert _normalise_phone(value) == "1712345678"

    def test_different_numbers_stay_different(self):
        assert _normalise_phone("01712345678") != _normalise_phone("01812345678")

    @pytest.mark.parametrize(
        "a,b",
        [
            ("01712345678", "+8801712345678"),
            ("+8801712345678", "8801712345678"),
            ("01712345678", "01712-345678"),
        ],
    )
    def test_equivalent_numbers_match(self, a, b):
        assert _same_phone(a, b)

    @pytest.mark.parametrize(
        "a,b",
        [
            ("01712345678", "01812345678"),
            ("01712345678", None),
            (None, "01712345678"),
            ("", "01712345678"),
            ("abc", "01712345678"),
        ],
    )
    def test_non_matching_or_missing_values_are_refused(self, a, b):
        assert not _same_phone(a, b)


class TestPIIMasking:
    def test_mask_customer_name(self):
        from app.schemas.order import mask_customer_name
        assert mask_customer_name("Tanvir Ahmed") == "Tanvir A***"
        assert mask_customer_name("Rahim") == "Ra***"
        assert mask_customer_name("") == "Customer"

    def test_mask_phone_number(self):
        from app.schemas.order import mask_phone_number
        assert mask_phone_number("01712345678") == "017****5678"
        assert mask_phone_number("123") == "****"

    def test_mask_email_address(self):
        from app.schemas.order import mask_email_address
        assert mask_email_address("customer@example.com") == "c***r@example.com"
        assert mask_email_address("ab@example.com") == "a*@example.com"
        assert mask_email_address(None) is None

    def test_mask_street_address(self):
        from app.schemas.order import mask_street_address
        assert mask_street_address("House 12, Road 4, Dhanmondi", "Dhaka") == "Dhanmondi, Dhaka"
        assert mask_street_address("Banani", "Dhaka") == "Area, Dhaka"


class TestLimiterClientKey:
    def test_untrusted_client_ignores_forwarded_headers(self):
        from app.core.limiter import _client_key
        class FakeRequest:
            client = type("Client", (), {"host": "198.51.100.25"})()
            headers = {"x-forwarded-for": "203.0.113.195", "x-real-ip": "203.0.113.195"}

        # Untrusted client IP must not spoof its identity via headers
        assert _client_key(FakeRequest()) == "198.51.100.25"

    def test_trusted_proxy_respects_forwarded_headers(self):
        from app.core.limiter import _client_key
        class FakeRequest:
            client = type("Client", (), {"host": "127.0.0.1"})()
            headers = {"x-forwarded-for": "203.0.113.195, 10.0.0.1", "x-real-ip": "203.0.113.195"}

        # Trusted reverse proxy (127.0.0.1) can pass client real IP
        assert _client_key(FakeRequest()) == "203.0.113.195"

