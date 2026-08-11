"""Registration, login, password reset and admin gating."""

import logging
import uuid

import pytest

pytestmark = pytest.mark.asyncio


class TestRegistration:
    async def test_register_returns_a_usable_token(self, client):
        email = f"new-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "a-good-password", "full_name": "New Customer"},
        )
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]

        me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == email
        # Registration must never be able to mint an admin.
        assert me.json()["role"] == "customer"

    async def test_duplicate_email_is_rejected(self, client):
        email = f"dupe-{uuid.uuid4().hex[:8]}@example.com"
        body = {"email": email, "password": "a-good-password"}
        assert (await client.post("/api/v1/auth/register", json=body)).status_code == 200
        assert (await client.post("/api/v1/auth/register", json=body)).status_code == 400

    @pytest.mark.parametrize("password", ["short", "1234567"])
    async def test_short_passwords_are_rejected(self, client, password):
        r = await client.post(
            "/api/v1/auth/register",
            json={"email": f"weak-{uuid.uuid4().hex[:8]}@example.com", "password": password},
        )
        assert r.status_code == 422

    async def test_password_beyond_bcrypt_limit_is_rejected(self, client):
        """bcrypt truncates at 72 bytes, so anything longer must not be accepted."""
        r = await client.post(
            "/api/v1/auth/register",
            json={"email": f"long-{uuid.uuid4().hex[:8]}@example.com", "password": "x" * 100},
        )
        assert r.status_code == 422

    async def test_invalid_email_is_rejected(self, client):
        r = await client.post(
            "/api/v1/auth/register", json={"email": "not-an-email", "password": "a-good-password"}
        )
        assert r.status_code == 422


class TestLogin:
    async def test_wrong_password_is_refused(self, client, make_user):
        user, _ = await make_user("customer")
        r = await client.post(
            "/api/v1/auth/login", data={"username": user.email, "password": "wrong-password"}
        )
        assert r.status_code == 400

    async def test_unknown_email_is_refused(self, client):
        r = await client.post(
            "/api/v1/auth/login",
            data={"username": "nobody@example.com", "password": "any-password"},
        )
        assert r.status_code == 400

    async def test_me_requires_a_token(self, client):
        assert (await client.get("/api/v1/auth/me")).status_code == 401

    async def test_me_rejects_a_forged_token(self, client):
        r = await client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer not.a.real.token"}
        )
        assert r.status_code == 401


class TestPasswordReset:
    async def _capture_link(self, client, email, caplog):
        with caplog.at_level(logging.WARNING, logger="app.core.mailer"):
            r = await client.post("/api/v1/auth/forgot-password", json={"email": email})
        assert r.status_code == 202
        tokens = [m.split("token=")[-1].strip() for m in caplog.messages if "token=" in m]
        return r, tokens

    async def test_no_account_enumeration(self, client, make_user, caplog):
        """Known and unknown addresses must be indistinguishable."""
        user, _ = await make_user("customer")
        known, _ = await self._capture_link(client, user.email, caplog)
        caplog.clear()
        unknown, _ = await self._capture_link(
            client, f"nobody-{uuid.uuid4().hex[:8]}@example.com", caplog
        )
        assert known.status_code == unknown.status_code
        assert known.json() == unknown.json()

    async def test_token_is_never_in_the_response_body(self, client, make_user, caplog):
        user, _ = await make_user("customer")
        r, _ = await self._capture_link(client, user.email, caplog)
        assert "token" not in r.text.lower()

    async def test_reset_flow_and_single_use(self, client, make_user, caplog):
        user, old_password = await make_user("customer")
        _, tokens = await self._capture_link(client, user.email, caplog)
        assert len(tokens) == 1
        token = tokens[0]

        new_password = "brand-new-password"
        ok = await client.post(
            "/api/v1/auth/reset-password", json={"token": token, "new_password": new_password}
        )
        assert ok.status_code == 200

        # Bound to the old password hash, so it dies the moment it is used.
        replay = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "another-password"},
        )
        assert replay.status_code == 400

        assert (
            await client.post(
                "/api/v1/auth/login", data={"username": user.email, "password": new_password}
            )
        ).status_code == 200
        assert (
            await client.post(
                "/api/v1/auth/login", data={"username": user.email, "password": old_password}
            )
        ).status_code == 400

    @pytest.mark.parametrize("token", ["not.a.jwt", "", "a" * 40])
    async def test_invalid_tokens_are_refused(self, client, token):
        r = await client.post(
            "/api/v1/auth/reset-password", json={"token": token, "new_password": "a-good-password"}
        )
        assert r.status_code in (400, 422)
