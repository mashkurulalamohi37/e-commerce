import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/product-queries";
import { brands } from "@/lib/catalog";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "All Beauty Brands — Nills Mart Bangladesh" },
      {
        name: "description",
        content:
          "Browse top brands and all brands of authentic skincare, makeup and hair care available in Bangladesh.",
      },
      { property: "og:title", content: "All Beauty Brands — Nills Mart" },
      {
        property: "og:description",
        content: "Top brands and all brands, 100% genuine, delivered nationwide.",
      },
    ],
  }),
  component: Brands,
});

function BrandCard({
  slug,
  name,
  origin,
  top,
  count,
}: {
  slug: string;
  name: string;
  origin: string;
  top?: boolean;
  count: number | null;
}) {
  return (
    <Link
      // Filters on the brand field rather than running a text search for the
      // brand's display name, which matched on description text.
      to="/search"
      search={{ q: name }}
      className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-base font-semibold">{name}</p>
        {top && (
          <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-foreground">
            Top
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {origin}
        {count !== null && ` · ${count} ${count === 1 ? "product" : "products"}`}
      </p>
    </Link>
  );
}

function Brands() {
  const { data: products } = useQuery(productsQueryOptions());
  // Null while loading, so the card shows the origin without a misleading "0 products".
  const countFor = (slug: string) =>
    products ? products.filter((p) => p.brandSlug === slug).length : null;

  // Top brands used to be rendered once here and again in "All Brands", so half
  // the page was a duplicate. One list, sorted so the top brands lead.
  const ordered = [...brands].sort((a, b) => {
    if (Boolean(a.top) !== Boolean(b.top)) return a.top ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-link">
          Home
        </Link>
        <span className="px-1">/</span>
        <span className="text-foreground">Brands</span>
      </nav>
      <h1 className="mt-2 font-display text-2xl font-semibold">Brands</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {brands.length} authorised brands, delivered nationwide. Top sellers first.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ordered.map((b) => (
          <BrandCard key={b.slug} {...b} count={countFor(b.slug)} />
        ))}
      </div>
    </div>
  );
}
