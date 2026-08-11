"""Shared fixtures.

Tests run against a real Postgres because the models use postgresql-specific
column types (UUID, JSON). Point TEST_DATABASE_URL at a throwaway database:

    docker run -d --rm --name nillsmart-test-pg \
      -e POSTGRES_PASSWORD=testpass -e POSTGRES_USER=testuser \
      -e POSTGRES_DB=nillsmart_test -p 55432:5432 postgres:16-alpine

    cd backend && pytest
"""

import os
import uuid

os.environ.setdefault(
    "TEST_DATABASE_URL", "postgresql+asyncpg://testuser:testpass@localhost:55432/nillsmart_test"
)
os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ.setdefault("SECRET_KEY", "test-secret-key-long-enough-for-hs256-padding")
os.environ.setdefault("ENVIRONMENT", "development")

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from asgi_lifespan import LifespanManager  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.core import security  # noqa: E402
from app.db.session import AsyncSessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.user import User  # noqa: E402

CUSTOMER_PHONE = "01712345678"


@pytest_asyncio.fixture
async def client():
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c


@pytest_asyncio.fixture
async def product():
    """A published product with known price and stock."""
    async with AsyncSessionLocal() as db:
        p = Product(
            id=uuid.uuid4(),
            sku=f"TST-{uuid.uuid4().hex[:8]}",
            slug=f"test-product-{uuid.uuid4().hex[:8]}",
            name="Test Serum",
            price=1450.0,
            list_price=1890.0,
            stock=10,
            categories=["Skin Care", "Serum"],
            concerns=["Dull Skin"],
            published=True,
        )
        db.add(p)
        await db.commit()
        await db.refresh(p)
        return p


@pytest_asyncio.fixture
async def make_user():
    async def _make(role: str = "customer", password: str = "test-password-123"):
        async with AsyncSessionLocal() as db:
            u = User(
                id=uuid.uuid4(),
                email=f"{role}-{uuid.uuid4().hex[:8]}@example.com",
                hashed_password=security.get_password_hash(password),
                full_name=f"Test {role.title()}",
                role=role,
            )
            db.add(u)
            await db.commit()
            await db.refresh(u)
            return u, password

    return _make


@pytest_asyncio.fixture
async def auth_header(client, make_user):
    async def _login(role: str = "customer"):
        user, password = await make_user(role)
        r = await client.post(
            "/api/v1/auth/login", data={"username": user.email, "password": password}
        )
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}, user

    return _login


def order_payload(product_id, qty=1, **overrides):
    payload = {
        "customer_name": "Test Buyer",
        "phone": CUSTOMER_PHONE,
        "address": "1 Test Road, Uttara",
        "city": "Dhaka",
        "delivery_zone": "inside_dhaka",
        "payment_method": "card",
        "items": [{"product_id": str(product_id), "qty": qty}],
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def make_order_payload():
    return order_payload
