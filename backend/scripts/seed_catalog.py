"""Seed the catalogue: brands, categories, products and banners.

Seeds products scraped directly from Nills Smart (https://nillsmart.com/).

    python scripts/seed_catalog.py --reset
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select, delete  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import AsyncSessionLocal, engine  # noqa: E402
from app.models.banner import Banner  # noqa: E402
from app.models.category import Brand, Category  # noqa: E402
from app.models.product import Product  # noqa: E402

BRANDS = [
    ("galenia-skin-care", "Galenia Skin Care", "Italy", True),
    ("swiss-formula", "Swiss Formula", "Switzerland", True),
    ("lipiol", "Lipiol Derm", "Italy", True),
    ("sebotic", "Sebotic Care", "Italy", True),
    ("keralise", "Keralise Lab", "Italy", True),
    ("lenus", "Lenus Body", "Italy", False),
    ("micoxil", "Micoxil Active", "Italy", False),
    ("protelion", "Protelion Sun", "Italy", False),
]

CATEGORIES = [
    ("skin-care", "Skin Care", ["Facewash", "Moisturizer", "Serum", "Sunscreen", "Scrubs & Exfoliators"]),
    ("hair-care", "Hair Care", ["Shampoo", "Serum"]),
    ("body-care", "Body Care", ["Lotion"]),
]

PRODUCTS = [
    ("SEBOTIC PHYSIOLOGICAL SHAMPOO 200 ML", "sebotic", "200 ML", 2240, 2576, 15, ["Hair Care", "Shampoo"], ["Dandruff", "Hair Fall"], True, True, "/catalog/b5f971788a1c.jpeg", "Daily delicate cleanser for hair and sensitive scalp providing volume and resistance. This delicate cleansing formula for daily hygiene strengthens fine, weak hair and sensitive scalp areas. Galenia Skin Care SEBOTIC PHYSIOLOGICAL\u00a0SHAMPOO also protects against harsh environmental physical agents. It\u00a0 is\u00a0 indicated to be used during specific treatments against hair loss and difficult dandruff\u00a0 conditions.This shampoo containing only delicate tensioactive agents, gently washes, without irritating while providing instant softness, vitality and shine due to an elevated conditioning and coating formula. Galenia Skin Care SEBOTIC PHYSIOLOGICAL SHAMPOO\u00a0is an ideal\u00a0\u00a0 solution for weak, greasy and brittle hair. It\u2019s special delicate formula is sebum-regulating, soothing, rebalancing, providing hair volume and resistance.\u00a0 This shampoo is advised for all ages.DERMATOLOGICALLY TESTEDNICKEL TESTEDFORMULATED WITHOUT PRESERVATIVES and S.L.S.\u00a0 HYPOALLERGENIC PERFUME"),
    ("MICOXIL (Antimycotic Active Cleanser) 250 ML", "micoxil", "250 ML", 2290, 2633, 18, ["Skin Care", "Facewash"], [], False, True, "/catalog/a69d82e069cb.jpeg", "Facial, body and hair cleansing adjuvant\u00a0for the preventionof superficial fungal problematics. Recommended for daily use. Suitable for those at risk of contracting cutaneous or scalp mycosis, creating an unfavorable environment for the proliferation of fungal flora.\u00a0 MICOXIL is also indicated as a delicate hygienic aid, for all ages, also in association with specific skin treatments or those who exercise and/or go to gyms, swimming pools or hot humid environments.FORMULATED WITHOUT SLES, PRESERVATIVES, SILICONES, MINERAL OILSHYPOALLERGENIC PERFUMEDERMATOLOGICALLY TESTEDNICKEL TESTED"),
    ("LIPIOL EMULSIONE (Intensive Emulsion) 250 ML", "lipiol", "250 ML", 3290, 3783, 21, ["Skin Care", "Moisturizer"], ["Dry Skin"], False, True, "/catalog/81ca02c166b7.jpeg", "LIPIOL EMULSIONE (intensive emulsion) is a moisturizing lotion with elevated hydration. It is a nourishing, keratolytic, calming and protective moisturizer for the treatment of very dry, chapped and sensitive skin conditions and helps restore the normal barrier function.\u00a0 Enriched with 20% stabilized Urea, this\u00a0 is a potent keratolytic emollient which is a gentle tissue softener for the skin. Thanks to the Glycerine complex and its rich formulation, LIPIOL EMULSIONE provides long lasting nourishment and protection.\u00a0This product is particularly ideal in all conditions of severe dryness, also associated with sensitive skin of constitutional origin, ageing, frequent and aggressive cleansing or associated with dermatological pathologies."),
    ("SWISS-FORMULA(Hair Serum) 0 ML", "swiss-formula", "0 ML", 1670, 1920, 24, ["Hair Care", "Shampoo"], ["Hair Fall"], True, True, "/catalog/550734a359ab.jpeg", "Swiss Formula Hair Serum is a premium hair care solution designed to nourish, protect, and revitalize your hair. Enriched with high-quality ingredients, this lightweight serum deeply hydrates and strengthens each strand, reducing frizz and adding a healthy shine. It helps to smooth rough and damaged hair, making it more manageable while protecting against heat and environmental damage. Ideal for all hair types, this serum enhances softness and silkiness without leaving a greasy residue. Regular use promotes healthier, stronger, and more radiant hair, giving you a salon-like finish every day."),
    ("LENUS (Soothing Body Lotion) 150 ML", "lenus", "150 ML", 2240, 2576, 27, ["Body Care", "Lotion"], [], False, True, "/catalog/f1ae08fbc328.jpeg", "LENUS (intensive, refreshing\u00a0and soothing body lotion)\u00a0contains Polidocanol, Glycerin and Ocean Algae which are distributed in an exclusive silicon emulsion that has a pleasant energetic, long lasting effect, offering immediate relief for any sensations of discomfort to reactive skin with a tendency to itchiness, blocking the vicious cycle that makes you scratch.\u00a0\u00a0It provides a prolonged moisturizing effect, thanks to the combined action of Glycerin, Urea and Allantoin. The light texture is quickly absorbed, making this lotion pleasant to use, even on difficult areas to reach or covered by hair, bringing an immediate sense of well-being to irritated areas, and a lasting freshness, as well as comfort, softness and elasticity to the skin.CLINICALLY PROVEN EFFECTIVENESS DERMATOLOGICALLY TESTED\u00a0 NICKEL TESTED\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 PARABEN FREEELABORATED FORMULA TO MINIMIZE RISK OF IRRITATING REACTIONS"),
    ("SWISS-FORMULA(Face Serum) 0 ML", "swiss-formula", "0 ML", 1990, 2288, 30, ["Skin Care", "Serum"], ["Acne Treatment"], False, True, "/catalog/ae315fe8276c.jpeg", "Known to boost production of Collagen; the proteins present in Vitamin C Serum are known to help improve the elasticity of the skin and tighten the poresThe serum is known to help unclog the pores, remove excess oil and dirt. It is known for tightening the pores thus making it ideal for acne prone skinVitamin C Serum is known for its natural skin brightening properties. Applying the serum regularly may help in fading dark spots, and lightening hyperpigmentationA well hydrated skin is smooth, supple and silky in texture. Vitamin C Serum is known to help decrease the water loss of the skin and, thus allowing it to retain moisture"),
    ("LIPIOL OLIO DETERGENTE (Cleansing Oil) 40 ML", "lipiol", "40 ML", 3290, 3783, 33, ["Skin Care"], ["Dry Skin"], True, True, "/catalog/50bbb1e4da7b.jpeg", "moisturizing, nourishing and lipid replenishing creamLIPIOL VISO (intensive facial cream) is a well-tolerated lipid replenshing, nourishing cosmetic and emollient aid based on panthenol and ceramides formulated for the most demanding conditions of dryness and sensitivity on the facial areas, also with atopic tendency.Due to its elevated and valuable lipid content, it reduces epidermal dehydration and offers long-lasting hydration and protection from external physical agents.\u00a0 Protective and easily absorbed, the skin is instantly softer and more compact.DERMATOLOGICALLY TESTED\u00a0 \u00a0 \u00a0 REPARATIVE and PROTECTIVE EFFICACY TESTED\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 NICKEL TESTED\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 FORMULATED WITHOUT PARABENS, FRAGRANCE\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0FOR SENSITIVE and INTOLERANT SKIN\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0In vitro analysis of the pro-sensitizing potential of a\u00a0 cosmetic product(evaluation of skin repair, protection & regenerating)"),
    ("KERALISE (Crema Comedolytic ) 30 ML", "keralise", "30 ML", 2240, 2576, 36, ["Skin Care"], ["Acne Treatment"], False, True, "/catalog/5e7b73c173a3.jpeg", "KERALISE (comedolytic cream) which exfoliates, purifies and soothes, contains Retinol that is released directly into the pilosebaceous follicles and conveyed in microspheres (liposomes). This encourages cell renewal with a better smoothing effect, without affecting the product\u2019s tolerability.\u00a0 The high panthenol content (5%) and glycyrrhetinic acid (0,5%) content make this product suitable, even for skin that is very reactive and intolerant. Light, soft and easily absorbed texture with a prolonged mat finish effect is the ideal foundation for make-up. Keratolytic and sebum-normalizing cream.\u00a0 Cosmetic complement, particularly suitable for impure and greasy skin with blemishes.\u00a0 Concentrated active formula with Glycolic Acid + Salicylic Acid + Retinol.\u00a0 This cream encourages cell renewal and provides a sensation of purity.\u00a0 Hydrates and smoothes skin, preventing and reducing blemishes caused by acne.PROVEN COMEDOLYTIC EFFICACY TESTEDPRESERVATIVE FREEHYPOALLERGENIC\u00a0 PERFUME\u00a0NICKEL TESTEDDERMATOLOGICALLY TESTED"),
    ("SEBOTIC ANTI-DANDRUFF SHAMPOO 125 ML", "sebotic", "125 ML", 2240, 2576, 39, ["Hair Care", "Shampoo"], ["Dandruff"], False, True, "/catalog/888044895fb0.jpeg", "SEBOTIC\u00a0ANTI-DANDRUFF SHAMPOO\u00a0is a complete dermocosmetic cleanser used for treating dry and greasy dandruff and intense flaky conditions of the scalp, body and beards.\u00a0 The powerful anti-dandruff synergy comes from the activity of two well-known anti-micotic agents: Ciclopiroxolamine and Clotrimazolo. This shampoo contains only delicate surfactants with no S.L.S. The cleansing base with micellar structure gently cleanses, balances and protects,\u00a0 without irritating. Galenia Skin Care\u00a0 SEBOTIC ANTI-DANDRUFF\u00a0SHAMPOO promotes rapid shedding of scales and gives a reactive phenomena immediately.Filmogenous polymers, conditioners and effective dermo protective proteins (hydrolyzed to favor its passage into the external cortical), protect and give the hair volume. It can also be used on more delicate areas (eyebrows, beard and chest areas) and as an auxiliary agent for hygiene. It soothes irritations and itching sensations of the scalp and rebalances sebaceous secretionCLINICALLY PROVEN EFFECTIVENESS NICKEL TESTEDDERMATOLOGICALLY TESTED\u00a0 FORMULATED WITHOUT S.L.S. DELICATE FORMULA TO MINIMIZE RISK OF IRRITATING CONDITIONS Evalutation of the inibitory power of Malassezia Furfur as evaluation parameter of the anti-dandruff power of a cosmetic product."),
    ("KERALISE GEL SCRUB 30 ML", "keralise", "30 ML", 2140, 2461, 17, ["Skin Care", "Facewash"], ["Acne Treatment", "Dry Skin"], True, True, "/catalog/e34091000811.jpeg", "Triple Effect: Exfoliating, Purifying and Soothing.KERALISE GEL SCRUB is designed for daily cleansing of greasy skin inclined to acne. The dual exfoliating mechanism ensures a purifying cleanser with a rapid smoothing effect. The double exfoliating mechanism of KERALISE GEL SCRUB guarantees a rapid \"smooth effect\". Contains dicarboxylic acids for progressive but delicate keratolysis. Thanks to the smooth and regular microspheres of vegetable cellulose, it removes impurities and reduces large pores.\u00a0 Rich in moisturizing elements, it provides long term protection after rinsing and contributes to rapid normalization of irritations. It does not cause dryness, but helps to reduce irritation, while offering immediate exfoliating\u00a0effect and\u00a0removing impurities from clogged, oily and impure skin.\u00a0 This scrub soothes imperfections\u00a0promoting skin renewal, smoothness\u00a0and greatly delays\u00a0a shiny effect and is ideal to prepare the skin before specific treatments for acne, blackheads and embedded hairs.\u00a0DOES NOT CONTAIN MICROPLASTICSPRESERVATIVE and S.L.S. FREEHYPOALLERGENIC\u00a0 PERFUME\u00a0NICKEL TESTEDDERMATOLOGICALLY TESTED"),
    ("LIPIOL BASE (Moisturizing Cream) 500 ML", "lipiol", "500 ML", 3990, 4588, 20, ["Skin Care", "Moisturizer"], ["Dry Skin"], False, True, "/catalog/80d1a228b4b5.png", "For normal, dry and extremely dry skinLIPIOL BASE is a restructuring cream, with elevated lipid content, which moisturizes for the protection of normal, dry and extremely dry skin.\u00a0 Containing functional substances that assist the natural functions of the hydrolipidic layer of the skin, the treated areas thus regain their well-being and natural equilibrium. This cream is also indicated for all conditions of severe dryness, also chronic in constitutional origin, caused by senescence or frequent and harsh cleansers."),
    ("LIPIOL VISO (Intensive Facial Cream) 40 ML", "lipiol", "40 ML", 2240, 2576, 23, ["Skin Care", "Moisturizer"], ["Dry Skin"], False, True, "/catalog/ee400ece5be1.jpeg", "LIPIOL VISO (intensive facial cream) is a well-tolerated lipid replenshing, nourishing cosmetic and emollient aid based on panthenol and ceramides formulated for the most demanding conditions of dryness and sensitivity on the facial areas, also with atopic tendency.Due to its elevated and valuable lipid content, it reduces epidermal dehydration and offers long-lasting hydration and protection from external physical agents.\u00a0 Protective and easily absorbed, the skin is instantly softer and more compact."),
    ("HY-SERUM--Hyaluronic-Acid 0 ML", "galenia-skin-care", "0 ML", 4290, 4933, 26, ["Skin Care", "Serum"], [], True, True, "/catalog/2ca4c1a0a203.jpeg", "Galenia Skin Care HY Serum\u00a0is a highly concentrated hyaluronic acid facial serum designed to deliver intense hydration and anti-aging benefits. It combines hyaluronic acid with other active substances such as polysaccharides, hydrolyzed proteins, tripeptides, and antioxidants to improve skin tone, firmness, and overall appearance."),
    ("PROTELION 50 EMULSION - EMULSIONE (UVB + UVA / SPF 50 for Oily & Sensitive Skin) 50 ML", "protelion", "50 ML", 2140, 2461, 29, ["Skin Care", "Moisturizer"], ["Dry Skin", "Sun Protection"], False, True, "/catalog/725f633d3c99.jpeg", "facial sunscreen for oily and sensitive skinElevated sun protection. Containing Sweet Almond Oil and Rice Oil.\u00a0 Delicate\u00a0 on\u00a0oily and sensitive\u00a0skin,\u00a0 avoiding\u00a0 dehydration.\u00a0 Association with\u00a0 physical\u00a0 and\u00a0 chemical\u00a0 solar\u00a0 filters.\u00a0 UVB\u00a0 +\u00a0 UVA protection. SPF 50.DERMATOLOGICALLY TESTEDNICKEL TESTEDFORMULATED WITHOUT PERFUME, PARABENS, SILICONES, MINERAL OILS, COLOURANTS and GLYCERIN"),
]

BANNERS = [
    ("hero", "Galenia Skin Care", "Sebotic Physiological & Anti-Dandruff Shampoo",
     "Dermatologically tested hair and scalp care formulated for sensitive and flaky scalp conditions.", "Explore Hair Care", "/category/hair-care",
     "/catalog/b5f971788a1c.jpeg", "Sebotic Physiological Shampoo", "dark", 1),
    ("hero", "Lipiol Derm Collection", "Lipiol Cleansing Oil & Intensive Facial Cream",
     "Lipid-replenishing, deep hydrating cosmetic care for dry and sensitive skin.", "Shop Lipiol Range", "/search?search=lipiol",
     "/catalog/50bbb1e4da7b.jpeg", "Lipiol Cleansing Oil", "dark", 2),
    ("hero", "Swiss Formula", "Hyaluronic Acid & Face Serums",
     "Concentrated serums engineered for skin hydration, collagen boosting and radiance.", "Shop Serums", "/category/skin-care",
     "/catalog/ae315fe8276c.jpeg", "Swiss Formula Face Serum", "dark", 3),
    ("hero", "Sun Protection", "Protelion 50 UVB + UVA Emulsion",
     "Elevated SPF 50 sun protection formulated for oily, delicate and sensitive skin.", "Shop Sunscreen", "/category/skin-care",
     "/catalog/725f633d3c99.jpeg", "Protelion 50 Emulsion", "dark", 4),
    ("offer", "Save up to 25%", "Lipiol Base & Viso Cream", "Restructuring moisturizing cream for severe skin dryness.",
     "Shop Lipiol", "/product/lipiol-base-moisturizing-cream", "/catalog/80d1a228b4b5.png",
     "Lipiol Base Cream", "dark", 1),
    ("offer", "Purifying Treatment", "Keralise Comedolytic & Gel Scrub", "Double exfoliating mechanism for oily and acne-prone skin.",
     "Shop Keralise", "/product/keralise-gel-scrub", "/catalog/e34091000811.jpeg",
     "Keralise Scrub", "dark", 2),
    ("offer", "Antimycotic Active", "Micoxil Active Cleanser", "Daily active hygienic cleanser for face, body and hair.",
     "Shop Micoxil", "/product/micoxil-antimycotic-active-cleanser", "/catalog/a69d82e069cb.jpeg",
     "Micoxil Cleanser", "dark", 3),
    ("offer", "Soothing Relief", "Lenus Refreshing Body Lotion", "Immediate relief for reactive skin and tendency to itchiness.",
     "Shop Lenus", "/product/lenus-soothing-body-lotion", "/catalog/f1ae08fbc328.jpeg",
     "Lenus Lotion", "dark", 4),
]


def slugify(value: str) -> str:
    out = "".join(c.lower() if c.isalnum() else "-" for c in value)
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-")


async def run(overwrite: bool, reset: bool) -> int:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    created = {"brands": 0, "categories": 0, "products": 0, "banners": 0}
    updated = 0

    async with AsyncSessionLocal() as db:
        if reset:
            await db.execute(delete(Product))
            await db.execute(delete(Category))
            await db.execute(delete(Brand))
            await db.execute(delete(Banner))
            await db.commit()
            print("Purged existing products, categories and brands from database.")

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
            name, brand, size, price, list_price, stock, cats, concerns, best_seller, on_offer, image_url, desc
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
                    existing.image_url = image_url
                    existing.brief = desc[:250] if desc else None
                    db.add(existing)
                    updated += 1
                continue

            db.add(
                Product(
                    sku=f"NILL-{1000 + index}",
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
                    image_url=image_url,
                    published=True,
                    rating=round(4.4 + (index % 5) / 10, 1),
                    reviews_count=24 + index * 5,
                    brief=desc[:250] if desc else f"{name} authentic product from Nills Smart.",
                    ingredients="Aqua, Glycerin, Panthenol, Ceramides, Tocopherol, Citric Acid, Phenoxyethanol.",
                    how_to_use="Apply as directed on product packaging to clean skin or scalp morning and night.",
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
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed the Nills Mart catalogue.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Reset price, stock and offer flags on products that already exist",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Purge existing products in DB before seeding new ones",
    )
    args = parser.parse_args()
    return asyncio.run(run(args.overwrite, args.reset))


if __name__ == "__main__":
    sys.exit(main())
