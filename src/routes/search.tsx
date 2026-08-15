import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Input } from "@/components/ui/input";
import { searchQueryOptions } from "@/lib/product-queries";
import {
  GRID_PAGE_SIZE,
  LoadMore,
  ProductGridSkeleton,
  ProductsEmptyState,
  ProductsErrorState,
} from "@/components/storefront/ProductGridStates";
import {
  ProductSort,
  isSortValue,
  sortProducts,
  type SortValue,
} from "@/components/storefront/ProductSort";

type SearchParams = { q?: string; sort?: SortValue };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
    ...(isSortValue(search.sort) ? { sort: search.sort } : {}),
  }),
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  // Prefetch so a shared or crawled search URL renders its results in the HTML
  // rather than an empty loading state.
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(searchQueryOptions(deps.q)),
  head: () => ({
    meta: [
      { title: "Search Beauty Products — Nills Mart Bangladesh" },
      {
        name: "description",
        content:
          "Search authentic skincare, makeup, hair and body care products by name, brand or concern.",
      },
      { property: "og:title", content: "Search Beauty Products — Nills Mart" },
      {
        property: "og:description",
        content: "Find the right product by name, brand or skin concern.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

const SUGGESTIONS = ["serum", "moisturizer", "lipstick", "hair oil", "sunscreen"];

function SearchPage() {
  const { q = "", sort = "relevance" } = Route.useSearch();
  const navigate = Route.useNavigate();

  // Local input state so typing stays responsive, with the URL updated on a
  // debounce. Navigating per keystroke previously pushed one history entry per
  // character, which made the Back button unusable.
  const [term, setTerm] = useState(q);
  useEffect(() => setTerm(q), [q]);
  useEffect(() => {
    if (term === q) return;
    const id = setTimeout(
      () => navigate({ search: (prev) => ({ ...prev, q: term || undefined }), replace: true }),
      300,
    );
    return () => clearTimeout(id);
  }, [term, q, navigate]);

  const { data, isPending, isError, isFetching, refetch } = useQuery(searchQueryOptions(q));
  const results = sortProducts(data ?? [], sort);

  // Reset the window whenever the query or the order changes, so a new search
  // doesn't open already scrolled several pages deep.
  const [shown, setShown] = useState(GRID_PAGE_SIZE);
  useEffect(() => setShown(GRID_PAGE_SIZE), [q, sort]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold">Search</h1>
      <Input
        className="mt-3"
        type="search"
        aria-label="Search products, brands or concerns"
        placeholder="Search products, brands or concerns"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />

      {isPending ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground">Searching…</p>
          <ProductGridSkeleton />
        </>
      ) : isError ? (
        <ProductsErrorState onRetry={() => void refetch()} />
      ) : results.length === 0 ? (
        <ProductsEmptyState
          term={q.trim()}
          suggestions={SUGGESTIONS}
          onSuggestion={(s) => navigate({ search: (prev) => ({ ...prev, q: s || undefined }) })}
        />
      ) : (
        <>
          <ProductSort
            className="mt-4"
            value={sort}
            count={results.length}
            onChange={(v) => navigate({ search: (prev) => ({ ...prev, sort: v }), replace: true })}
          />
          {isFetching && (
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              Updating…
            </p>
          )}
          <div
            className={`mt-3 grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 lg:grid-cols-4 ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {results.slice(0, shown).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <LoadMore
            shown={Math.min(shown, results.length)}
            total={results.length}
            onMore={() => setShown((s) => s + GRID_PAGE_SIZE)}
          />
        </>
      )}
    </div>
  );
}
