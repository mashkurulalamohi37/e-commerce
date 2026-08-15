import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/storefront/ProductCard";
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
import { productsQueryOptions } from "@/lib/product-queries";
import { categoryBySlug } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Search = { sub?: string; sort?: SortValue };

export const Route = createFileRoute("/category/$slug")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search.sub === "string" ? { sub: search.sub } : {}),
    ...(isSortValue(search.sort) ? { sort: search.sort } : {}),
  }),
  loader: ({ params, context }) => {
    const category = categoryBySlug(params.slug);
    if (!category) throw notFound();
    // Server-side category filter, rather than fetching everything and
    // filtering in the browser.
    void context.queryClient.prefetchQuery(productsQueryOptions({ category: params.slug }));
    return { category };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Category";
    const description = `Shop ${name.toLowerCase()} products at Nills Mart — 100% genuine beauty and personal care delivered across Bangladesh.`;
    return {
      meta: [
        { title: `${name} — Shop ${name} Online | Nills Mart` },
        { name: "description", content: description },
        { property: "og:title", content: `${name} — Nills Mart Bangladesh` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { sub, sort = "relevance" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { category } = Route.useLoaderData();

  const { data, isPending, isError, refetch } = useQuery(productsQueryOptions({ category: slug }));

  // Subcategory chips used to run a text search across the whole catalogue, so
  // "Toner" could return a shampoo and miss an actual toner. They now narrow
  // this department's own results.
  const inSub = sub
    ? (data ?? []).filter((p) => {
        const needle = sub.toLowerCase();
        const cats = p.categories.map((c) => c.toLowerCase());
        const name = p.name.toLowerCase();
        const brief = p.brief.toLowerCase();
        const concerns = p.concerns.map((c) => c.toLowerCase());

        // 1. Direct or partial match in product categories list
        if (cats.some((c) => c === needle || c.includes(needle) || needle.includes(c))) {
          return true;
        }

        // 2. Smart synonym and keyword matching
        if (needle.includes("facewash") || needle.includes("cleans")) {
          if (
            cats.some((c) => c.includes("facewash") || c.includes("cleans")) ||
            name.includes("cleanser") ||
            name.includes("wash") ||
            brief.includes("cleans")
          ) {
            return true;
          }
        }

        if (needle.includes("scrub") || needle.includes("exfoliat")) {
          if (
            cats.some((c) => c.includes("scrub") || c.includes("exfoliat")) ||
            name.includes("scrub") ||
            brief.includes("exfoliat")
          ) {
            return true;
          }
        }

        // 3. Fallback search across product name, brief, and concerns
        return (
          name.includes(needle) ||
          brief.includes(needle) ||
          concerns.some((c) => c.includes(needle))
        );
      })
    : (data ?? []);

  const items = sortProducts(inSub, sort);

  const [shown, setShown] = useState(GRID_PAGE_SIZE);
  useEffect(() => setShown(GRID_PAGE_SIZE), [slug, sub, sort]);

  const setSub = (next?: string) =>
    navigate({ search: (prev) => ({ ...prev, sub: next }), replace: true });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-link">
          Home
        </Link>
        <span className="px-1">/</span>
        <Link to="/categories" className="hover:text-link">
          Categories
        </Link>
        <span className="px-1">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>
      <h1 className="mt-2 font-display text-2xl font-semibold">{category.name}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSub(undefined)}
          aria-pressed={!sub}
          className={cn(
            "min-h-9 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !sub ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent",
          )}
        >
          All
        </button>
        {category.children.map((child: string) => (
          <button
            key={child}
            type="button"
            onClick={() => setSub(sub === child ? undefined : child)}
            aria-pressed={sub === child}
            className={cn(
              "min-h-9 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              sub === child ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent",
            )}
          >
            {child}
          </button>
        ))}
      </div>

      {isPending ? (
        <ProductGridSkeleton />
      ) : isError ? (
        <ProductsErrorState onRetry={() => void refetch()} />
      ) : items.length ? (
        <>
          <ProductSort
            className="mt-5"
            value={sort}
            count={items.length}
            onChange={(v) => navigate({ search: (prev) => ({ ...prev, sort: v }), replace: true })}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.slice(0, shown).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <LoadMore
            shown={Math.min(shown, items.length)}
            total={items.length}
            onMore={() => setShown((s) => s + GRID_PAGE_SIZE)}
          />
        </>
      ) : (
        // Was a single grey sentence with nothing to click, while search got the
        // full empty state.
        <ProductsEmptyState
          term={sub}
          suggestions={category.children}
          onSuggestion={(s) => setSub(s || undefined)}
        />
      )}
    </div>
  );
}
