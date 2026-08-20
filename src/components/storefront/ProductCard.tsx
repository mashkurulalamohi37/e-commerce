import { Link } from "@tanstack/react-router";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { discount, taka, brandName, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { trackPromoConversion } from "@/lib/analytics";

export function ProductCard({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const off = discount(product);
  // The detail page already refuses to sell a sold-out product. Without the same
  // guard here the grid offered "Add to cart" on stock 0 and advertised
  // "Only 0 left in stock".
  const soldOut = product.stock <= 0;

  const prefetchProduct = () => {
    if (typeof window !== "undefined" && product.image) {
      const img = new Image();
      img.src = product.image;
    }
  };

  return (
    <article
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
      onMouseEnter={prefetchProduct}
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        preload="intent"
        className="relative block overflow-hidden"
      >
        <img
          src={product.image}
          alt={product.name}
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          className={`aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            soldOut ? "opacity-60 saturate-50" : ""
          }`}
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {off > 0 && !soldOut && (
            <span className="inline-flex rounded-full bg-sale px-2.5 py-0.5 text-[11px] font-extrabold text-sale-foreground shadow-sm">
              -{off}% OFF
            </span>
          )}
          {soldOut && (
            <span className="inline-flex rounded-full bg-foreground/85 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-background shadow-sm">
              Sold out
            </span>
          )}
        </div>
        {product.bestSeller && !soldOut && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-gold-foreground shadow-sm">
            Best seller
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {brandName(product.brandSlug)}
          </p>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            preload="intent"
            className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-link sm:text-base"
          >
            {product.name}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">{product.size}</p>
          {product.reviews > 0 && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="size-3 fill-rating text-rating" aria-hidden />
              <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
              <span>({product.reviews})</span>
            </p>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base font-extrabold text-foreground sm:text-lg">
              {taka(product.price)}
            </span>
            {off > 0 && (
              <span className="text-xs font-semibold text-muted-foreground line-through">
                {taka(product.listPrice)}
              </span>
            )}
          </div>
          {!soldOut && product.stock <= 6 && (
            <p className="mt-0.5 text-[11px] font-bold text-sale">
              Only {product.stock} left in stock
            </p>
          )}
          <Button
            size="sm"
            disabled={soldOut}
            className="mt-3 w-full gap-2 rounded-xl font-bold shadow-sm transition-transform active:scale-[0.98]"
            onClick={() => {
              // A full-height drawer over every grid add meant dismissing it
              // and re-finding your scroll position for each item.
              add(product, 1, { silent: true });
              toast.success(`${product.name} added to your cart`, {
                action: { label: "View cart", onClick: () => setOpen(true) },
              });
              trackPromoConversion("add_to_cart", {
                product_slug: product.slug,
                product_name: product.name,
                price: product.price,
              });
            }}
          >
            {soldOut ? (
              "Out of stock"
            ) : (
              <>
                <ShoppingCart className="size-4" />
                Add to cart
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
