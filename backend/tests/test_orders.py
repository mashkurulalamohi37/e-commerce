"""Order creation, pricing and payment.

Regression cover for the defects found in the QA pass: client-supplied prices,
overselling, cash-on-delivery being marked paid, and order data readable by
anyone who could guess an order number.
"""

import asyncio
import uuid

import pytest
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.product import Product
from tests.conftest import CUSTOMER_PHONE, order_payload

pytestmark = pytest.mark.asyncio


async def stock_of(product_id) -> int:
    async with AsyncSessionLocal() as db:
        row = (await db.execute(select(Product).where(Product.id == product_id))).scalars().first()
        return row.stock


class TestPricing:
    async def test_client_supplied_unit_price_is_rejected(self, client, product):
        """A buyer must not be able to name their own price."""
        payload = order_payload(product.id, qty=2)
        payload["items"][0]["unit_price"] = 1
        r = await client.post("/api/v1/orders/", json=payload)
        assert r.status_code == 422

    async def test_totals_are_computed_from_the_database(self, client, product):
        r = await client.post("/api/v1/orders/", json=order_payload(product.id, qty=2))
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["subtotal"] == product.price * 2
        assert body["delivery_fee"] == 79.0
        assert body["total"] == product.price * 2 + 79.0
        assert body["items"][0]["unit_price"] == product.price

    async def test_outside_dhaka_delivery_fee(self, client, product):
        r = await client.post(
            "/api/v1/orders/", json=order_payload(product.id, delivery_zone="outside_dhaka")
        )
        assert r.json()["delivery_fee"] == 119.0


class TestValidation:
    @pytest.mark.parametrize("qty", [0, -5, 999])
    async def test_quantity_bounds(self, client, product, qty):
        r = await client.post("/api/v1/orders/", json=order_payload(product.id, qty=qty))
        assert r.status_code == 422

    async def test_unknown_product_is_rejected(self, client):
        r = await client.post("/api/v1/orders/", json=order_payload(uuid.uuid4()))
        assert r.status_code == 400

    async def test_order_beyond_stock_is_rejected(self, client, product):
        r = await client.post("/api/v1/orders/", json=order_payload(product.id, qty=product.stock + 1))
        assert r.status_code == 409

    async def test_empty_item_list_is_rejected(self, client, product):
        r = await client.post("/api/v1/orders/", json=order_payload(product.id, items=[]))
        assert r.status_code == 400


class TestPaymentStatus:
    async def test_cash_on_delivery_is_not_marked_paid(self, client, product):
        """COD is a promise to pay, not a payment."""
        r = await client.post(
            "/api/v1/orders/", json=order_payload(product.id, payment_method="cod")
        )
        assert r.json()["payment_status"] == "unpaid"

    async def test_card_order_starts_pending(self, client, product):
        r = await client.post("/api/v1/orders/", json=order_payload(product.id))
        assert r.json()["payment_status"] == "pending"


class TestPaymentAuthorisation:
    async def test_payment_without_proof_is_refused(self, client, product):
        order = (await client.post("/api/v1/orders/", json=order_payload(product.id))).json()
        r = await client.post(f"/api/v1/orders/{order['id']}/pay", json={})
        assert r.status_code == 403

    async def test_payment_with_wrong_phone_is_refused(self, client, product):
        """Knowing an order id must not be enough to pay for it."""
        order = (await client.post("/api/v1/orders/", json=order_payload(product.id))).json()
        r = await client.post(
            f"/api/v1/orders/{order['id']}/pay", json={"phone": "01999999999"}
        )
        assert r.status_code == 403

    async def test_payment_for_unknown_order_is_404(self, client):
        r = await client.post(f"/api/v1/orders/{uuid.uuid4()}/pay", json={"phone": CUSTOMER_PHONE})
        assert r.status_code == 404

    async def test_payment_records_the_money_and_leaves_stock_alone(self, client, product):
        """Stock is committed when the order is placed, not when it is paid for."""
        before = await stock_of(product.id)
        order = (await client.post("/api/v1/orders/", json=order_payload(product.id, qty=3))).json()
        reserved = await stock_of(product.id)
        assert reserved == before - 3

        r = await client.post(f"/api/v1/orders/{order['id']}/pay", json={"phone": CUSTOMER_PHONE})
        assert r.status_code == 200
        assert r.json()["payment_status"] == "paid"
        assert r.json()["payment_reference"]
        assert await stock_of(product.id) == reserved

    async def test_payment_is_idempotent(self, client, product):
        """A retried confirmation must not be charged or counted twice."""
        order = (await client.post("/api/v1/orders/", json=order_payload(product.id, qty=2))).json()
        await client.post(f"/api/v1/orders/{order['id']}/pay", json={"phone": CUSTOMER_PHONE})
        after_first = await stock_of(product.id)

        r = await client.post(f"/api/v1/orders/{order['id']}/pay", json={"phone": CUSTOMER_PHONE})
        assert r.status_code == 200
        assert await stock_of(product.id) == after_first

    async def test_phone_format_variants_are_accepted(self, client, product):
        order = (await client.post("/api/v1/orders/", json=order_payload(product.id))).json()
        r = await client.post(
            f"/api/v1/orders/{order['id']}/pay", json={"phone": "+8801712345678"}
        )
        assert r.status_code == 200


async def set_stock(product_id, value: int) -> None:
    async with AsyncSessionLocal() as db:
        row = (
            await db.execute(select(Product).where(Product.id == product_id))
        ).scalars().first()
        row.stock = value
        db.add(row)
        await db.commit()


class TestInventory:
    """Stock is committed at order creation, so it cannot be sold twice.

    It used to move only inside /pay, which checkout skips for cash on delivery —
    so COD orders never cost inventory and the same units could be sold forever.
    """

    async def test_cash_on_delivery_reserves_stock(self, client, product):
        before = await stock_of(product.id)
        r = await client.post(
            "/api/v1/orders/", json=order_payload(product.id, qty=2, payment_method="cod")
        )
        assert r.status_code == 200, r.text
        assert await stock_of(product.id) == before - 2

    async def test_cash_on_delivery_cannot_oversell(self, client, product):
        await set_stock(product.id, 5)
        first = await client.post(
            "/api/v1/orders/", json=order_payload(product.id, qty=5, payment_method="cod")
        )
        assert first.status_code == 200, first.text

        second = await client.post(
            "/api/v1/orders/", json=order_payload(product.id, qty=5, payment_method="cod")
        )
        assert second.status_code == 409
        assert await stock_of(product.id) == 0

    async def test_last_unit_cannot_be_sold_twice(self, client, product):
        """Two shoppers racing for the last stock: exactly one wins."""
        await set_stock(product.id, 2)

        results = await asyncio.gather(
            client.post("/api/v1/orders/", json=order_payload(product.id, qty=2)),
            client.post("/api/v1/orders/", json=order_payload(product.id, qty=2)),
        )
        assert sorted(r.status_code for r in results) == [200, 409]
        assert await stock_of(product.id) == 0

    async def test_cancelling_an_order_returns_its_stock(self, client, product, auth_header):
        admin, _ = await auth_header("admin")
        await set_stock(product.id, 4)
        order = (
            await client.post("/api/v1/orders/", json=order_payload(product.id, qty=3))
        ).json()
        assert await stock_of(product.id) == 1

        r = await client.patch(
            f"/api/v1/orders/{order['id']}/status", json={"status": "cancelled"}, headers=admin
        )
        assert r.status_code == 200, r.text
        assert await stock_of(product.id) == 4

    async def test_admin_marking_paid_does_not_move_stock_again(
        self, client, product, auth_header
    ):
        """Revenue was booked without inventory when an admin confirmed by hand."""
        admin, _ = await auth_header("admin")
        order = (
            await client.post("/api/v1/orders/", json=order_payload(product.id, qty=2))
        ).json()
        reserved = await stock_of(product.id)

        r = await client.patch(
            f"/api/v1/orders/{order['id']}/status",
            json={"payment_status": "paid"},
            headers=admin,
        )
        assert r.status_code == 200, r.text
        assert await stock_of(product.id) == reserved


class TestIdempotency:
    async def test_repeated_key_returns_the_same_order(self, client, product):
        """A double-click used to place two real orders."""
        before = await stock_of(product.id)
        headers = {"Idempotency-Key": f"checkout-{uuid.uuid4()}"}
        payload = order_payload(product.id, qty=1)

        first = await client.post("/api/v1/orders/", json=payload, headers=headers)
        second = await client.post("/api/v1/orders/", json=payload, headers=headers)

        assert first.status_code == second.status_code == 200
        assert first.json()["order_number"] == second.json()["order_number"]
        assert await stock_of(product.id) == before - 1

    async def test_different_keys_create_different_orders(self, client, product):
        payload = order_payload(product.id, qty=1)
        first = await client.post(
            "/api/v1/orders/", json=payload, headers={"Idempotency-Key": str(uuid.uuid4())}
        )
        second = await client.post(
            "/api/v1/orders/", json=payload, headers={"Idempotency-Key": str(uuid.uuid4())}
        )
        assert first.json()["order_number"] != second.json()["order_number"]


class TestTracking:
    async def test_tracking_requires_the_matching_phone(self, client, product):
        """The order number alone is not a credential."""
        order = (await client.post("/api/v1/orders/", json=order_payload(product.id))).json()

        ok = await client.get(
            "/api/v1/orders/track",
            params={"order_number": order["order_number"], "phone": CUSTOMER_PHONE},
        )
        assert ok.status_code == 200

        wrong = await client.get(
            "/api/v1/orders/track",
            params={"order_number": order["order_number"], "phone": "01999999999"},
        )
        assert wrong.status_code == 404

    async def test_order_numbers_are_not_sequential(self, client, product):
        numbers = []
        for _ in range(5):
            r = await client.post("/api/v1/orders/", json=order_payload(product.id))
            numbers.append(r.json()["order_number"])

        assert len(set(numbers)) == 5
        # A walkable counter would make tracking enumerable even with the phone check.
        suffixes = [n.split("-")[1] for n in numbers]
        assert all(len(s) == 10 for s in suffixes)
        assert len(set(suffixes)) == 5


class TestAdminAccess:
    async def test_admin_order_list_requires_authentication(self, client):
        r = await client.get("/api/v1/orders/admin/list")
        assert r.status_code == 401

    async def test_customer_cannot_read_the_admin_order_list(self, client, auth_header):
        headers, _ = await auth_header("customer")
        r = await client.get("/api/v1/orders/admin/list", headers=headers)
        assert r.status_code == 403

    async def test_admin_can_read_the_order_list(self, client, auth_header):
        headers, _ = await auth_header("admin")
        r = await client.get("/api/v1/orders/admin/list", headers=headers)
        assert r.status_code == 200
