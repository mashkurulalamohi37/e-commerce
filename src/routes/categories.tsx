import { createFileRoute, Link } from "@tanstack/react-router";
import { categories, concerns } from "@/lib/catalog";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Shop Beauty by Category — Nills Mart Bangladesh" },
      {
        name: "description",
        content:
          "Skin care, makeup, hair care, body care, fragrance and more. Shop by category or by skin concern.",
      },
      { property: "og:title", content: "Shop Beauty by Category — Nills Mart" },
      {
        property: "og:description",
        content: "Browse every category and skin concern in one place.",
      },
    ],
  }),
  component: Categories,
});

function Categories() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold">Categories</h1>

      <div className="mt-4 space-y-4">
        {categories.map((c) => (
          <section
            key={c.slug}
            id={c.slug}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <h2 className="font-display text-base font-semibold">
              <Link to="/category/$slug" params={{ slug: c.slug }} className="hover:text-link">
                {c.name}
              </Link>
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.children.map((child) => (
                <Link
                  key={child}
                  // Was /search?q=child, which matched on free text across the
                  // whole catalogue instead of narrowing this department.
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  search={{ sub: child }}
                  className="min-h-9 rounded-full bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {child}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <h2 id="concerns" className="section-title mt-8">
        Shop by concern
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {concerns.map((c) => (
          <Link
            key={c.title}
            to="/search"
            search={{ q: c.query }}
            className="min-h-9 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {c.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
