import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Lock, Headphones, Star } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ReviewsSection } from "@/components/storefront/ReviewsSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api-client";
import { useCart } from "@/lib/cart";
import { productQueryOptions, productsQueryOptions } from "@/lib/product-queries";
import { averageRating, reviewsQueryOptions } from "@/lib/review-queries";
import {
  brandName,
  categoryBySlug,
  discount,
  taka,
  DELIVERY_INSIDE_DHAKA,
  DELIVERY_OUTSIDE_DHAKA,
} from "@/lib/catalog";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    try {
      return await context.queryClient.ensureQueryData(productQueryOptions(params.slug));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — ${brandName(loaderData.brandSlug)} | Nills Mart` },
          { name: "description", content: loaderData.brief.slice(0, 155) },
          { property: "og:title", content: `${loaderData.name} — Nills Mart` },
          { property: "og:description", content: loaderData.brief.slice(0, 155) },
        ]
      : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const initial = Route.useLoaderData();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  // Keep the page live: stock and price can change while it is open.
  const { data: product = initial } = useQuery({
    ...productQueryOptions(initial.slug),
    initialData: initial,
  });
  const { data: all = [] } = useQuery(productsQueryOptions());

  // Single source of truth for the rating shown here and in the Reviews tab.
  const { data: reviews = [] } = useQuery(reviewsQueryOptions(product.id));
  const liveRating = averageRating(reviews);
  const reviewCount = reviews.length;

  const off = discount(product);
  const related = all.filter((p) => p.id !== product.id).slice(0, 4);
  const soldOut = product.stock <= 0;

  return (
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="px-4 pt-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-link">
          Home
        </Link>{" "}
        /{" "}
        {/* Links to the department itself, not the category index — the label
            said "Skin Care" while the destination was the full directory. */}
        <Link
          to="/category/$slug"
          params={{ slug: product.categories[0] ?? "skin-care" }}
          className="hover:text-link"
        >
          {categoryBySlug(product.categories[0])?.name ?? product.categories[0]}
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="md:grid md:grid-cols-2 md:gap-8 md:px-4">
        <img
          src={product.image}
          alt={product.name}
          width={800}
          height={800}
          fetchPriority="high"
          decoding="async"
          className="mt-3 aspect-square w-full object-cover md:rounded-2xl"
        />

        <div className="px-4 pt-4 md:px-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {brandName(product.brandSlug)}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">{product.name}</h1>
          {reviewCount > 0 ? (
            <a
              href="#reviews"
              className="mt-2 flex w-fit items-center gap-1 text-sm hover:underline"
            >
              <Star className="size-4 fill-rating text-rating" aria-hidden />
              <span className="font-semibold">{liveRating?.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No reviews yet</p>
          )}

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold">{taka(product.price)}</span>
            <span className="text-sm text-muted-foreground line-through">
              {taka(product.listPrice)}
            </span>
            <span className="rounded-full bg-sale px-2 py-0.5 text-xs font-bold text-sale-foreground">
              -{off}%
            </span>
          </div>
          <p className="mt-1 text-sm text-link">
            You save {taka(product.listPrice - product.price)}
          </p>
          {soldOut ? (
            <p className="mt-1 text-sm font-semibold text-destructive">Out of stock</p>
          ) : (
            product.stock <= 6 && (
              <p className="mt-1 text-sm font-medium text-sale">
                Only {product.stock} {product.stock === 1 ? "item" : "items"} left in stock
              </p>
            )
          )}

          {/* A description is not a specification — it was wrapping the 110px
              label column into three lines. It sits above the list now. */}
          <p className="mt-4 text-sm text-muted-foreground">{product.brief}</p>

          <dl className="mt-4 grid grid-cols-[140px_1fr] gap-y-1 text-sm">
            <dt className="text-muted-foreground">Size</dt>
            <dd>{product.size}</dd>
            <dt className="text-muted-foreground">SKU</dt>
            <dd>{product.sku}</dd>
            <dt className="text-muted-foreground">Category</dt>
            <dd>{product.categories.map((c) => categoryBySlug(c)?.name ?? c).join(", ")}</dd>
            <dt className="text-muted-foreground">Brand</dt>
            <dd>{brandName(product.brandSlug)}</dd>
          </dl>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Quantity
              </span>
              <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                  onClick={() => setQty((q: number) => Math.max(1, q - 1))}
                  className="grid size-11 place-items-center rounded-lg text-lg font-bold transition-colors hover:bg-muted disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className="w-10 text-center font-display text-base font-extrabold"
                >
                  <span className="sr-only">Quantity: </span>
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= product.stock}
                  onClick={() => setQty((q: number) => Math.min(product.stock, q + 1))}
                  className="grid size-11 place-items-center rounded-lg text-lg font-bold transition-colors hover:bg-muted disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {soldOut ? (
              // A disabled pair of buttons was a dead end — the only way on was
              // the Back button. Offer the two things a shopper actually wants.
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-foreground">This one is sold out</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We restock regularly. Browse the rest of{" "}
                  {categoryBySlug(product.categories[0])?.name ?? "the range"} in the meantime.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="lg" className="font-bold">
                    <Link
                      to="/category/$slug"
                      params={{ slug: product.categories[0] ?? "skin-care" }}
                    >
                      See similar products
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="font-bold">
                    <Link to="/offers">Shop live offers</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 font-bold shadow-md"
                  onClick={() => add(product, qty)}
                >
                  Add to cart
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1 font-bold"
                  onClick={() => {
                    // silent: the drawer would otherwise open on top of checkout.
                    add(product, qty, { silent: true });
                    navigate({ to: "/checkout" });
                  }}
                >
                  Buy now
                </Button>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-semibold">Available Offers</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
              <li>Loyalty points launching soon — 1 point per ৳100 spent.</li>
              <li>
                Delivery {taka(DELIVERY_INSIDE_DHAKA)} inside Dhaka, {taka(DELIVERY_OUTSIDE_DHAKA)}{" "}
                outside Dhaka.
              </li>
              <li>Pay with bKash or any major card.</li>
            </ul>
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
            {[
              { icon: ShieldCheck, label: "100% Genuine Products" },
              { icon: Lock, label: "100% Secure Payments" },
              { icon: Headphones, label: "Help Center" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-2 text-center font-medium"
              >
                <Icon className="size-4 text-link" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Tabs id="reviews" defaultValue="description" className="mt-8 px-4">
        <TabsList className="no-scrollbar w-full justify-start overflow-x-auto">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="how">How To Use</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="text-sm text-muted-foreground">
          {product.brief}
        </TabsContent>
        <TabsContent value="ingredients" className="text-sm text-muted-foreground">
          {product.ingredients}
        </TabsContent>
        <TabsContent value="how" className="text-sm text-muted-foreground">
          {product.howToUse}
        </TabsContent>
        {/* Reviews and Q&A share one component; both tabs render the live data
            rather than the placeholder copy that used to sit here. */}
        <TabsContent value="reviews">
          <ReviewsSection productId={product.id} section="reviews" />
        </TabsContent>
        <TabsContent value="qa">
          <ReviewsSection productId={product.id} section="questions" />
        </TabsContent>
      </Tabs>

      <section className="mt-10 px-4">
        <h2 className="section-title">You may also like</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
