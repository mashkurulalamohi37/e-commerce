"""Seed the catalogue: brands, categories, products and banners.

These 12 products used to be a hardcoded array in the storefront, which meant
admin price and stock edits never reached shoppers. They live in the database
now; this script gets a fresh install to the same starting point.

    python scripts/seed_catalog.py

Idempotent — matches on slug, so re-running updates rather than duplicating.
Existing prices and stock are left alone unless --overwrite is passed.
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import AsyncSessionLocal, engine  # noqa: E402
from app.models.banner import Banner  # noqa: E402
from app.models.category import Brand, Category  # noqa: E402
from app.models.product import Product  # noqa: E402

BRANDS = [
    ("radiant-skin-co", "Radiant Skin Co.", "Korea", True),
    ("noorja-beauty-lab", "Noorja Beauty Lab", "Bangladesh", True),
    ("aurelia-botanics", "Aurelia Botanics", "France", True),
    ("hikari-derm", "Hikari Derm", "Japan", True),
    ("meraki-colour", "Meraki Colour", "Italy", True),
    ("tulsi-roots", "Tulsi & Roots", "India", False),
    ("coastline-care", "Coastline Care", "Thailand", False),
    ("atelier-nine", "Atelier Nine", "UK", False),
    ("bloom-baby", "Bloom Baby", "Bangladesh", False),
    ("north-mens-co", "North Men's Co.", "USA", False),
]

CATEGORIES = [
    ("skin-care", "Skin Care", ["Facewash", "Toner", "Moisturizer", "Masks & Peels", "Scrubs & Exfoliators"]),
    ("makeup", "Makeup", ["Lips", "Face", "Eyes", "Nails"]),
    ("hair-care", "Hair Care", ["Shampoo", "Conditioner", "Hair Oil", "Serum"]),
    ("body-care", "Body Care", ["Body Wash", "Lotion", "Hand Care"]),
    ("fragrance", "Fragrance", ["Perfume", "Body Mist", "Attar"]),
    ("baby-care", "Baby Care", ["Bath", "Lotion", "Diapering"]),
    ("men-care", "Men Care", ["Shaving", "Face Care", "Hair"]),
    ("jewellery", "Jewellery", ["Earrings", "Necklace", "Rings"]),
    ("accessories", "Accessories", ["Brushes", "Tools", "Bags"]),
    ("daily-needs", "Daily Needs", ["Oral Care", "Hygiene", "Tissue"]),
]

# name, brand, size, price, list_price, stock, categories, concerns, best_seller, on_offer
PRODUCTS = [
    ("Vitamin C Glow Serum", "radiant-skin-co", "30 ml", 1450, 1890, 6,
     ["Skin Care", "Serum"], ["Dull Skin", "Pigmentation"], True, True),
    ("Barrier Repair Moisturizer", "hikari-derm", "50 ml", 1290, 1690, 14,
     ["Skin Care", "Moisturizer"], ["Anti Aging"], False, True),
    ("Velvet Matte Lipstick", "meraki-colour", "3.8 g", 890, 1150, 3,
     ["Makeup", "Lips"], [], True, True),
    ("Rice Water Hair Duo", "tulsi-roots", "300 ml", 1150, 1450, 22,
     ["Hair Care", "Shampoo"], [], False, False),
    ("Niacinamide Oil Control Serum", "noorja-beauty-lab", "30 ml", 990, 1250, 9,
     ["Skin Care", "Serum"], ["Oil Control", "Acne Treatment"], False, True),
    ("Ceramide Night Cream", "aurelia-botanics", "45 ml", 2150, 2690, 5,
     ["Skin Care", "Moisturizer"], ["Anti Aging", "Dull Skin"], True, True),
    ("Mineral Sunscreen SPF 50+", "hikari-derm", "50 ml", 1390, 1590, 18,
     ["Skin Care", "Sunscreen"], ["Sun Protection", "Tan Removal"], False, False),
    ("Argan Repair Hair Oil", "coastline-care", "100 ml", 760, 950, 27,
     ["Hair Care", "Hair Oil"], [], False, True),
    ("Rose Clay Purifying Mask", "aurelia-botanics", "75 g", 840, 1090, 11,
     ["Skin Care", "Masks & Peels"], ["Acne Treatment", "Oil Control"], False, False),
    ("Satin Tint Lip Balm", "meraki-colour", "4 g", 650, 790, 31,
     ["Makeup", "Lips"], [], False, True),
    ("Gentle Foaming Facewash", "noorja-beauty-lab", "150 ml", 540, 690, 40,
     ["Skin Care", "Facewash"], ["Oil Control"], False, False),
    ("Beard & Face Grooming Oil", "north-mens-co", "50 ml", 720, 890, 8,
     ["Men Care", "Hair"], [], False, False),
]

BANNERS = [
    ("hero", "New season edit", "Glow that travels well in Dhaka weather",
     "Lightweight serums and barrier creams built for humidity.", "Shop the offers", "/offers",
     "/banners/hero-1.jpg", "Glass serum bottle and cream jar on draped linen in warm daylight", "dark", 1),
    ("hero", "Best sellers", "The routine our customers reorder most",
     "Vitamin C, niacinamide and ceramides — restocked weekly.", "Shop best sellers", "/search",
     "/banners/hero-2.jpg", "Row of skincare bottles arranged on a soft pink studio backdrop", "dark", 2),
    ("hero", "Makeup", "Colour that lasts from office to iftar",
     "Long-wear lips and skin tints in shades made for us.", "Explore makeup", "/categories",
     "/banners/hero-3.jpg", "Open lipstick bullet and compact powder on a marble surface", "dark", 3),
    ("offer", "Save up to 40%", "Beauty must haves", "Everyday essentials at bundle prices.",
     "Shop now", "/offers", "/banners/offer-1.jpg",
     "Skincare essentials grouped together with a discount tag", "dark", 1),
    ("offer", "Buy 1 get 1", "Double the glow", "Selected serums and masks, this week only.",
     "Grab the deal", "/offers", "/banners/offer-2.jpg",
     "Two matching serum bottles side by side on a pastel background", "dark", 2),
    ("offer", "Combo packs", "Build your routine", "Cleanse, treat and moisturise for less.",
     "View combos", "/offers", "/banners/offer-3.jpg",
     "Cleanser, serum and moisturiser arranged as a routine set", "light", 3),
    ("offer", "Daily Essentials", "Hydrating Care", "Cleanse and nourish your skin daily.",
     "Explore deals", "/offers", "/banners/offer-4.jpg",
     "Skincare product flatlay on pastel background", "dark", 4),
]


def slugify(value: str) -> str:
    out = "".join(c.lower() if c.isalnum() else "-" for c in value)
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-")


async def run(overwrite: bool) -> int:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    created = {"brands": 0, "categories": 0, "products": 0, "banners": 0}
    updated = 0

    async with AsyncSessionLocal() as db:
        for slug, name, origin, is_top in BRANDS:
            existing = (await db.execute(select(Brand).where(Brand.slug == slug))).scalars().first()
            if not existing:
                db.add(Brand(slug=slug, name=name, origin=origin, is_top=is_top))
                created["brands"] += 1

        for index, (slug, name, children) in enumerate(CATEGORIES):
            existing = (
                (await db.execute(select(Category).where(Category.slug == slug))).scalars().first()
            )
            if not existing:
                db.add(Category(slug=slug, name=name, children=children, sort_order=index))
                created["categories"] += 1

        for index, (
            name, brand, size, price, list_price, stock, cats, concerns, best_seller, on_offer
        ) in enumerate(PRODUCTS):
            slug = slugify(name)
            existing = (
                (await db.execute(select(Product).where(Product.slug == slug))).scalars().first()
            )
            if existing:
                if overwrite:
                    existing.price = float(price)
                    existing.list_price = float(list_price)
                    existing.stock = stock
                    existing.on_offer = on_offer
                    existing.best_seller = best_seller
                    db.add(existing)
                    updated += 1
                continue

            db.add(
                Product(
                    sku=f"{name[:3].upper()}-{1000 + index}",
                    name=name,
                    slug=slug,
                    brand_slug=brand,
                    size=size,
                    price=float(price),
                    list_price=float(list_price),
                    stock=stock,
                    categories=cats,
                    concerns=concerns,
                    best_seller=best_seller,
                    on_offer=on_offer,
                    published=True,
                    rating=round(4.3 + (index % 6) / 10, 1),
                    reviews_count=18 + index * 7,
                    brief=(
                        f"{name} from {dict((b[0], b[1]) for b in BRANDS).get(brand, brand)}. "
                        "Dermatologist-tested, cruelty free and formulated for humid South Asian weather."
                    ),
                    ingredients=(
                        "Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, "
                        "Tocopherol, Citric Acid, Phenoxyethanol."
                    ),
                    how_to_use=(
                        "Apply a small amount to clean skin morning and night. "
                        "Follow with moisturizer and sunscreen during the day."
                    ),
                )
            )
            created["products"] += 1

        for placement, kicker, title, subtitle, cta_label, cta_href, image, alt, tone, order in BANNERS:
            existing = (
                (await db.execute(select(Banner).where(Banner.title == title))).scalars().first()
            )
            if not existing:
                db.add(
                    Banner(
                        placement=placement,
                        kicker=kicker,
                        title=title,
                        subtitle=subtitle,
                        cta_label=cta_label,
                        cta_href=cta_href,
                        image_url=image,
                        alt=alt,
                        tone=tone,
                        sort_order=order,
                        active=True,
                    )
                )
                created["banners"] += 1

        await db.commit()

    summary = ", ".join(f"{count} {kind}" for kind, count in created.items() if count)
    print(f"Seeded: {summary or 'nothing new'}" + (f"; updated {updated} products" if updated else ""))
    print("Run with --overwrite to reset seeded prices and stock to their defaults.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed the Nills Mart catalogue.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Reset price, stock and offer flags on products that already exist",
    )
    args = parser.parse_args()
    return asyncio.run(run(args.overwrite))


if __name__ == "__main__":
    sys.exit(main())
