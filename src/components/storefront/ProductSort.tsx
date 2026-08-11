import { discount, type Product } from "@/lib/catalog";

export const SORT_OPTIONS = [
  { value: "relevance", label: "Most relevant" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
  { value: "rating", label: "Top rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function isSortValue(v: unknown): v is SortValue {
  return typeof v === "string" && SORT_OPTIONS.some((o) => o.value === v);
}

/** Sorts a copy — callers pass query data straight from the cache. */
export function sortProducts(items: Product[], sort: SortValue): Product[] {
  const out = [...items];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "discount":
      return out.sort((a, b) => discount(b) - discount(a));
    case "rating":
      return out.sort((a, b) => b.rating - a.rating);
    default:
      return out;
  }
}

/**
 * Shared by search, category, offers and promo. None of these grids offered any
 * way to reorder results, which is the first thing a shopper reaches for once a
 * list runs past a screen.
 */
export function ProductSort({
  value,
  onChange,
  count,
  className,
}: {
  value: SortValue;
  onChange: (v: SortValue) => void;
  count?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className ?? ""}`}>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {count === undefined ? "" : `${count} ${count === 1 ? "product" : "products"}`}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="product-sort" className="text-sm text-muted-foreground">
          Sort by
        </label>
        <select
          id="product-sort"
          value={value}
          onChange={(e) => onChange(e.target.value as SortValue)}
          className="h-10 rounded-md border border-input bg-card px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
