import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/storefront/ProductCard";
import { OfferCarousel } from "@/components/storefront/OfferCarousel";
import { ProductGridSkeleton, ProductsEmptyState } from "@/components/storefront/ProductGridStates";
import {
  ProductSort,
  isSortValue,
  sortProducts,
  type SortValue,
} from "@/components/storefront/ProductSort";
import { bannersQueryOptions, byPlacement } from "@/lib/banner-queries";
import { productsQueryOptions } from "@/lib/product-queries";

export const Route = createFileRoute("/offers")({
  validateSearch: (search: Record<string, unknown>): { sort?: SortValue } => ({
    ...(isSortValue(search.sort) ? { sort: search.sort } : {}),
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(bannersQueryOptions),
      context.queryClient.ensureQueryData(productsQueryOptions({ onOffer: true })),
    ]),
  head: () => ({
    meta: [
      { title: "Limited Time Offers & Deals — Nills Mart Bangladesh" },
      {
        name: "description",
        content:
          "Live discounts on genuine beauty products. Limited time offers on skincare, makeup and hair care in BDT.",
      },
      { property: "og:title", content: "Limited Time Offers — Nills Mart" },
      {
        property: "og:description",
        content: "Deals you cannot miss on authentic beauty products.",
      },
    ],
  }),
  component: Offers,
});

function Offers() {
  const { sort = "discount" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: banners } = useSuspenseQuery(bannersQueryOptions);
  // Only products actually flagged as on-offer. This page used to list the
  // entire catalogue, so nothing about it was "limited".
  const { data: onOffer, isPending } = useSuspenseQuery(productsQueryOptions({ onOffer: true }));
  // Still biggest-discount-first by default, but the shopper can now change it
  // and can see which order they are looking at.
  const sorted = sortProducts(onOffer, sort);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold">Limited Time Offers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Offers end when stock runs out. Prices shown in BDT and include VAT.
      </p>
      <div className="mt-4">
        <OfferCarousel slides={byPlacement(banners, "offer")} />
      </div>
      {isPending ? (
        <ProductGridSkeleton />
      ) : sorted.length === 0 ? (
        <ProductsEmptyState suggestions={["serum", "moisturizer", "hair oil"]} />
      ) : (
        <>
          <ProductSort
            className="mt-5"
            value={sort}
            count={sorted.length}
            onChange={(v) => navigate({ search: (prev) => ({ ...prev, sort: v }), replace: true })}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
