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
