"""Product listing, search, admin visibility and uploads."""

import uuid

import pytest

from app.db.session import AsyncSessionLocal
from app.models.product import Product

pytestmark = pytest.mark.asyncio


class TestPublicListing:
    async def test_unpublished_products_are_hidden_from_shoppers(self, client):
        async with AsyncSessionLocal() as db:
            hidden = Product(
                id=uuid.uuid4(),
                sku=f"HID-{uuid.uuid4().hex[:8]}",
                slug=f"hidden-{uuid.uuid4().hex[:8]}",
                name="Hidden Product",
                price=100.0,
                stock=5,
                categories=["Skin Care"],
                published=False,
            )
            db.add(hidden)
            await db.commit()
            slug = hidden.slug

        r = await client.get("/api/v1/products/?limit=200")
        assert slug not in [p["slug"] for p in r.json()]

    async def test_product_by_slug(self, client, product):
        r = await client.get(f"/api/v1/products/by-slug/{product.slug}")
        assert r.status_code == 200
        assert r.json()["name"] == product.name

    async def test_unknown_slug_is_404(self, client):
        assert (await client.get("/api/v1/products/by-slug/nope-not-real")).status_code == 404


class TestSearch:
    async def test_search_matches_the_product_name(self, client, product):
        r = await client.get("/api/v1/products/", params={"search": "Test Serum"})
        assert product.slug in [p["slug"] for p in r.json()]

    async def test_search_matches_a_category(self, client, product):
        """Shoppers search by category as often as by name."""
        r = await client.get("/api/v1/products/", params={"search": "Serum"})
        assert product.slug in [p["slug"] for p in r.json()]

    async def test_search_matches_a_concern(self, client, product):
        r = await client.get("/api/v1/products/", params={"search": "Dull Skin"})
        assert product.slug in [p["slug"] for p in r.json()]

    async def test_search_is_case_insensitive(self, client, product):
        r = await client.get("/api/v1/products/", params={"search": "test serum"})
        assert product.slug in [p["slug"] for p in r.json()]

    async def test_no_match_returns_an_empty_list(self, client):
        r = await client.get("/api/v1/products/", params={"search": "zzzzz-no-such-product"})
        assert r.status_code == 200
        assert r.json() == []

    async def test_special_characters_do_not_break_the_query(self, client):
        for term in ["100%", "'; drop table products; --", "<script>", "50% off"]:
            r = await client.get("/api/v1/products/", params={"search": term})
            assert r.status_code == 200


class TestAdminListing:
    async def test_admin_listing_requires_admin(self, client, auth_header):
        assert (await client.get("/api/v1/products/admin/list")).status_code == 401
        headers, _ = await auth_header("customer")
        assert (await client.get("/api/v1/products/admin/list", headers=headers)).status_code == 403

    async def test_admin_sees_unpublished_products(self, client, auth_header):
        """Unpublishing used to hide a product from the admin table permanently."""
        async with AsyncSessionLocal() as db:
            hidden = Product(
                id=uuid.uuid4(),
                sku=f"ADM-{uuid.uuid4().hex[:8]}",
                slug=f"admin-hidden-{uuid.uuid4().hex[:8]}",
                name="Admin Hidden Product",
                price=100.0,
                stock=5,
                categories=["Skin Care"],
                published=False,
            )
            db.add(hidden)
            await db.commit()
            slug = hidden.slug

        headers, _ = await auth_header("admin")
        r = await client.get("/api/v1/products/admin/list", headers=headers)
        assert r.status_code == 200
        assert slug in [p["slug"] for p in r.json()]

    async def test_write_endpoints_require_admin(self, client, auth_header, product):
        headers, _ = await auth_header("customer")
        assert (
            await client.put(
                f"/api/v1/products/{product.id}", json={"price": 1.0}, headers=headers
            )
        ).status_code == 403
        assert (
            await client.delete(f"/api/v1/products/{product.id}", headers=headers)
        ).status_code == 403


class TestBanners:
    async def test_public_banner_list_is_open(self, client):
        assert (await client.get("/api/v1/banners/")).status_code == 200

    async def test_admin_banner_list_requires_admin(self, client, auth_header):
        assert (await client.get("/api/v1/banners/admin/list")).status_code == 401
        headers, _ = await auth_header("customer")
        assert (await client.get("/api/v1/banners/admin/list", headers=headers)).status_code == 403

    async def test_banner_requires_alt_text(self, client, auth_header):
        """The storefront's largest image must not be unannounced."""
        headers, _ = await auth_header("admin")
        r = await client.post(
            "/api/v1/banners/",
            headers=headers,
            json={"title": "No alt", "image_url": "/banners/hero-1.jpg", "placement": "hero"},
        )
        assert r.status_code == 422


class TestUploads:
    PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64

    async def test_upload_requires_admin(self, client):
        r = await client.post(
            "/api/v1/uploads/", files={"file": ("x.png", self.PNG, "image/png")}
        )
        assert r.status_code == 401

    async def test_disguised_executable_is_rejected(self, client, auth_header):
        """Extension and Content-Type both come from the client; sniff the bytes."""
        headers, _ = await auth_header("admin")
        r = await client.post(
            "/api/v1/uploads/",
            headers=headers,
            files={"file": ("payload.png", b"MZ\x90\x00 not an image at all", "image/png")},
        )
        assert r.status_code == 400

    async def test_genuine_png_is_accepted(self, client, auth_header):
        headers, _ = await auth_header("admin")
        r = await client.post(
            "/api/v1/uploads/",
            headers=headers,
            files={"file": ("real.png", self.PNG, "image/png")},
        )
        assert r.status_code == 200
        assert r.json()["url"].startswith("/uploads/")

    async def test_disallowed_extension_is_rejected(self, client, auth_header):
        headers, _ = await auth_header("admin")
        r = await client.post(
            "/api/v1/uploads/",
            headers=headers,
            files={"file": ("script.svg", b"<svg/>", "image/svg+xml")},
        )
        assert r.status_code == 400


class TestAnalytics:
    async def test_analytics_requires_admin(self, client, auth_header):
        assert (await client.get("/api/v1/analytics/")).status_code == 401
        headers, _ = await auth_header("customer")
        assert (await client.get("/api/v1/analytics/", headers=headers)).status_code == 403

    async def test_admin_analytics_shape(self, client, auth_header):
        headers, _ = await auth_header("admin")
        r = await client.get("/api/v1/analytics/?days=30", headers=headers)
        assert r.status_code == 200
        body = r.json()
        assert body["range_days"] == 30
        assert len(body["sales_by_day"]) == 30  # zero-filled, not sparse
        assert {"revenue", "paid_orders", "total_orders", "aov"} <= set(body["totals"])

    @pytest.mark.parametrize("days", [1, 400])
    async def test_out_of_range_windows_are_rejected(self, client, auth_header, days):
        headers, _ = await auth_header("admin")
        assert (
            await client.get(f"/api/v1/analytics/?days={days}", headers=headers)
        ).status_code == 422
