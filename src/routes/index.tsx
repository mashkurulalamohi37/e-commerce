import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck, Truck, Lock, Headphones } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { OfferTiles } from "@/components/storefront/OfferTiles";
import { bannersQueryOptions, byPlacement } from "@/lib/banner-queries";
import { productsQueryOptions } from "@/lib/product-queries";
import { categoryBySlug, countInCategory } from "@/lib/catalog";
import { ConcernTiles } from "@/components/storefront/ConcernTiles";
import { BrandOfferGrid } from "@/components/storefront/BrandOfferGrid";
import catMakeup from "@/assets/cat-makeup.jpg";
import catKbeauty from "@/assets/cat-kbeauty.jpg";
import catHair from "@/assets/cat-hair.jpg";
import catBaby from "@/assets/cat-baby.jpg";

const categoryTiles = [
  {
    slug: "skin-care",
    image: catKbeauty,
    alt: "Shop skin care category",
    blurb: "Cleansers, serums, exfoliators and moisturizers.",
  },
  {
    slug: "hair-care",
    image: catHair,
    alt: "Shop hair care category",
    blurb: "Shampoo, serums and scalp treatment formulas.",
  },
  {
    slug: "body-care",
    image: catBaby,
    alt: "Shop body care category",
    blurb: "Nourishing lotions and soothing body care.",
  },
];

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(bannersQueryOptions),
      context.queryClient.ensureQueryData(productsQueryOptions()),
    ]),
  head: () => ({
    meta: [
      { title: "Nills Mart — Genuine Beauty & Skincare Delivered in Bangladesh" },
      {
        name: "description",
        content:
          "Discover deals on skincare, makeup, hair and body care. 100% genuine products, ৳79 Dhaka delivery, bKash and card payments.",
      },
      { property: "og:title", content: "Nills Mart — Genuine Beauty & Skincare in Bangladesh" },
      {
        property: "og:description",
        content:
          "Deals you cannot miss, top brands and limited time offers on authentic beauty products.",
      },
    ],
  }),
  component: Home,
});

function SectionHeader({ kicker, title, to }: { kicker?: string; title: string; to?: string }) {
  return (
    <div className="mb-4 flex flex-col items-center justify-between gap-1 px-4 text-center sm:mb-6 sm:flex-row sm:text-left">
      <div>
        {kicker && (
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-link">
            {kicker}
          </span>
        )}
        <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground sm:text-xl lg:text-2xl">
          {title}
        </h2>
      </div>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-link transition-colors hover:text-foreground"
        >
          View all →
        </Link>
      )}
    </div>
  );
}

function Home() {
  const { data: banners } = useSuspenseQuery(bannersQueryOptions);
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const heroSlides = byPlacement(banners, "hero");
  const offerSlides = byPlacement(banners, "offer");
  const limited = products.filter((p) => p.onOffer).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-12 py-3 sm:space-y-16 sm:py-4">
      <h1 className="sr-only">
        Nills Mart — genuine beauty and personal care, delivered across Bangladesh
      </h1>

      {/* Hero Carousel Banner Container */}
      <div className="px-3 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/60 shadow-lift backdrop-blur-md">
          <HeroCarousel slides={heroSlides} />
        </div>
      </div>

      {/* Quick Trust Highlights Feature Bar */}
      <div className="px-3 sm:px-6">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-card backdrop-blur-sm sm:grid-cols-4 sm:gap-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground sm:text-sm">100% Authentic</p>
              <p className="text-[11px] text-muted-foreground">Directly imported brands</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Truck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground sm:text-sm">Fast BD Shipping</p>
              <p className="text-[11px] text-muted-foreground">৳79 Dhaka delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Lock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground sm:text-sm">Secure Payment</p>
              <p className="text-[11px] text-muted-foreground">bKash, Card & Cash</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Headphones className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground sm:text-sm">Dedicated Support</p>
              <p className="text-[11px] text-muted-foreground">7 days customer care</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Section */}
      <section>
        <SectionHeader kicker="Curated Promotions" title="Deals You Cannot Miss" to="/offers" />
        <OfferTiles slides={offerSlides} />
      </section>

      {/* Top Brands Grid */}
      <section>
        <SectionHeader kicker="Partner Brands" title="Top Brands & Special Offers" to="/brands" />
        <BrandOfferGrid />
      </section>

      {/* Shop by Category */}
      <section>
        <SectionHeader
          kicker="Explore Catalog"
          title="Shop Beauty Products by Category"
          to="/categories"
        />
        <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-4 sm:px-6 lg:gap-5">
          {categoryTiles.map((t) => {
            const count = countInCategory(products, t.slug);
            return (
              <Link
                key={t.slug}
                to="/category/$slug"
                params={{ slug: t.slug }}
                className="group block rounded-2xl border border-border/60 bg-card/80 p-2.5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="wave-tile block overflow-hidden">
                  <img
                    src={t.image}
                    alt={t.alt}
                    width={816}
                    height={816}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-2.5 px-1 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="truncate font-display text-sm font-bold text-foreground group-hover:text-link sm:text-base">
                      {categoryBySlug(t.slug)?.name ?? t.slug}
                    </h3>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                    {t.blurb}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Limited Time Offers */}
      <section>
        <SectionHeader kicker="Handpicked Savings" title="Limited Time Offers" to="/offers" />
        <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6">
          {limited.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Concern Tiles */}
      <section>
        <SectionHeader kicker="Targeted Care" title="Shop by Concern" to="/categories" />
        <ConcernTiles />
      </section>
    </div>
  );
}
