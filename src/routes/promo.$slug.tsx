import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  ProductGridSkeleton,
  ProductsEmptyState,
  ProductsErrorState,
} from "@/components/storefront/ProductGridStates";
import { searchQueryOptions } from "@/lib/product-queries";
import { promoBySlug } from "@/lib/promos";
import { track, trackPromoView, setPromoAttribution } from "@/lib/analytics";

export const Route = createFileRoute("/promo/$slug")({
  loader: ({ params }) => {
    const promo = promoBySlug(params.slug);
    if (!promo) throw notFound();
    return { promo };
  },
  head: ({ loaderData }) => {
    const promo = loaderData?.promo;
    if (!promo) {
      return {
        meta: [{ title: "Offer not found — Nills Mart" }, { name: "robots", content: "noindex" }],
      };
    }
    const description = `${promo.headline} — ${promo.blurb} Shop genuine products with fast delivery across Bangladesh.`;
    return {
      meta: [
        { title: `${promo.headline} — ${promo.sub} | Nills Mart` },
        { name: "description", content: description },
        { property: "og:title", content: `${promo.headline} — Nills Mart` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PromoPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Offer not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This promotion may have ended.{" "}
        <Link to="/offers" className="text-link underline">
          See live offers
        </Link>
        .
      </p>
    </div>
  ),
});

function PromoPage() {
  const { promo } = Route.useLoaderData();
  const { data, isPending, isError, refetch } = useQuery(searchQueryOptions(promo.query));
  const results = data ?? [];

  useEffect(() => {
    setPromoAttribution(promo.slug, promo.headline);
  }, [promo.slug, promo.headline]);

  useEffect(() => {
    if (!isPending && !isError) trackPromoView(promo.slug, promo.headline, results.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promo.slug, isPending, isError, results.length]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-link">
          Home
        </Link>
        <span className="px-1">/</span>
        <Link to="/offers" className="hover:text-link">
          Offers
        </Link>
      </nav>

      <div className="mt-3 overflow-hidden rounded-xl shadow-card">
        <img
          src={promo.image}
          alt={promo.alt}
          width={1152}
          height={512}
          className="h-[140px] w-full object-cover sm:h-[200px] lg:h-[240px]"
        />
      </div>

      <h1 className="mt-4 font-display text-2xl font-semibold">{promo.headline}</h1>
      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-link">{promo.sub}</p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{promo.blurb}</p>

      {isPending ? (
        <ProductGridSkeleton />
      ) : isError ? (
        <ProductsErrorState onRetry={() => void refetch()} />
      ) : results.length === 0 ? (
        <ProductsEmptyState term={promo.query} suggestions={["serum", "hair oil", "body care"]} />
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "product" : "products"} in this promotion
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
              <div
                key={p.id}
                onClickCapture={() =>
                  track("promo_product_click", { promo_slug: promo.slug, product_slug: p.slug })
                }
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
