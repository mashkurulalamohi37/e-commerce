"""SQL Injection Resilience & Parameter Sanitization Tests."""

import uuid
import pytest

from app.core.security_sql import escape_like_term
from app.db.session import AsyncSessionLocal
from app.models.product import Product

pytestmark = pytest.mark.asyncio


class TestSQLEscapingUtils:
    async def test_escape_like_term_handles_special_characters(self):
        assert escape_like_term("") == ""
        assert escape_like_term("normal text") == "normal text"
        assert escape_like_term("100% discount") == r"100\% discount"
        assert escape_like_term("user_name") == r"user\_name"
        assert escape_like_term(r"path\to\file") == r"path\\to\\file"
        assert escape_like_term(r"100%_user\test") == r"100\%\_user\\test"


class TestSQLiResilience:
    @pytest.mark.parametrize(
        "payload",
        [
            "' OR '1'='1",
            "'; DROP TABLE products; --",
            "' UNION SELECT id, email, hashed_password FROM users --",
            "admin' --",
            "1' AND 1=1 --",
            "1' AND SLEEP(2) --",
            "' OR 1=1 #",
            '" OR "1"="1',
        ],
    )
    async def test_search_endpoint_handles_sqli_payloads_safely(self, client, payload):
        """SQL injection payloads in product search must return empty list or 200 without error."""
        r = await client.get("/api/v1/products/", params={"search": payload})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    @pytest.mark.parametrize(
        "payload",
        [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "admin' --",
        ],
    )
    async def test_auth_login_handles_sqli_payloads_safely(self, client, payload):
        """SQL injection attempts in login username/email must be rejected cleanly (400 bad credentials)."""
        r = await client.post(
            "/api/v1/auth/login",
            data={"username": payload, "password": "password123"},
        )
        assert r.status_code == 400
        assert "Incorrect email" in r.json()["detail"]

    async def test_like_wildcard_escaping_matches_literal_percents_and_underscores(self, client):
        """Ensure search for '%' or '_' doesn't wildcard-match everything when literal products exist."""
        async with AsyncSessionLocal() as db:
            p1 = Product(
                id=uuid.uuid4(),
                sku=f"PERC-{uuid.uuid4().hex[:8]}",
                slug=f"perc-{uuid.uuid4().hex[:8]}",
                name="100% Organic Serum",
                price=50.0,
                stock=10,
                categories=["Skin Care"],
                published=True,
            )
            p2 = Product(
                id=uuid.uuid4(),
                sku=f"UND-{uuid.uuid4().hex[:8]}",
                slug=f"und-{uuid.uuid4().hex[:8]}",
                name="Under_Eye Cream",
                price=60.0,
                stock=10,
                categories=["Skin Care"],
                published=True,
            )
            p3 = Product(
                id=uuid.uuid4(),
                sku=f"PLAIN-{uuid.uuid4().hex[:8]}",
                slug=f"plain-{uuid.uuid4().hex[:8]}",
                name="Plain Moisture Lotion",
                price=40.0,
                stock=10,
                categories=["Skin Care"],
                published=True,
            )
            db.add_all([p1, p2, p3])
            await db.commit()

        # Searching for literal "%" should return only "100% Organic Serum", not all products
        r_perc = await client.get("/api/v1/products/", params={"search": "100%"})
        assert r_perc.status_code == 200
        perc_names = [p["name"] for p in r_perc.json()]
        assert "100% Organic Serum" in perc_names
        assert "Plain Moisture Lotion" not in perc_names

        # Searching for literal "_" should return "Under_Eye Cream", not match "Under Eye" or plain items
        r_und = await client.get("/api/v1/products/", params={"search": "Under_Eye"})
        assert r_und.status_code == 200
        und_names = [p["name"] for p in r_und.json()]
        assert "Under_Eye Cream" in und_names
        assert "Plain Moisture Lotion" not in und_names

    @pytest.mark.parametrize(
        "malformed_id",
        [
            "not-a-uuid",
            "' OR 1=1 --",
            "12345",
        ],
    )
    async def test_uuid_endpoint_rejects_malformed_sqli_ids(self, client, malformed_id):
        """Endpoints expecting UUID parameters should fail fast with 422 Unprocessable Entity."""
        r = await client.get(f"/api/v1/feedback/reviews/{malformed_id}")
        assert r.status_code == 422
