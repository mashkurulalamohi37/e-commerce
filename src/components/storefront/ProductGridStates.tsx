import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading products"
      className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="skeleton-shimmer aspect-square w-full" />
          <div className="space-y-2 p-3">
            <div className="skeleton-shimmer h-2.5 w-1/2 rounded" />
            <div className="skeleton-shimmer h-3.5 w-full rounded" />
            <div className="skeleton-shimmer h-3.5 w-2/3 rounded" />
            <div className="skeleton-shimmer h-4 w-1/3 rounded" />
            <div className="skeleton-shimmer h-8 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductsEmptyState({
  term,
  suggestions = [],
  onSuggestion,
}: {
  term?: string;
  suggestions?: string[];
  onSuggestion?: (s: string) => void;
}) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
      <p className="font-display text-lg font-semibold">
        {term ? `No products match “${term}”` : "Nothing to show yet"}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Try a shorter term, check the spelling, or browse a category instead. New stock lands every
        week.
      </p>
      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) =>
            onSuggestion ? (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                {s}
              </button>
            ) : (
              <Link
                key={s}
                to="/search"
                search={{ q: s }}
                className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                {s}
              </Link>
            ),
          )}
        </div>
      )}
      <div className="mt-5 flex justify-center gap-2">
        {term && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSuggestion?.("")}
            className="gap-1 font-bold"
          >
            Clear search
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <Link to="/categories">Browse categories</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/offers">See live offers</Link>
        </Button>
      </div>
    </div>
  );
}

/** How many products a grid shows before the shopper asks for more. */
export const GRID_PAGE_SIZE = 24;

/**
 * Grids rendered every result at once — fine at a few dozen products, slow and
 * unscannable past that. Callers slice to `shown` and render this underneath.
 */
export function LoadMore({
  shown,
  total,
  noun = "products",
  onMore,
}: {
  shown: number;
  total: number;
  noun?: string;
  onMore: () => void;
}) {
  if (shown >= total) return null;

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        Showing {shown} of {total} {noun}
      </p>
      <Button variant="outline" onClick={onMore}>
        Load more
      </Button>
    </div>
  );
}

export function ProductsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
    >
      <p className="font-display text-lg font-semibold">We couldn't load these products</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Something went wrong on our side. Check your connection and try again.
      </p>
      <Button size="sm" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
