import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { MAX_QTY_PER_LINE, useCart } from "@/lib/cart";
import { taka, DELIVERY_INSIDE_DHAKA } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, subtotal, loading } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="font-display tracking-wide">Your bag</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {loading && (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading your bag…</p>
          )}
          {!loading && lines.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Your bag is empty.</p>
          )}
          {lines.map(({ product, qty }) => (
            <div
              key={product.slug}
              className="flex gap-3 rounded-lg border border-border bg-card p-2"
            >
              <img
                src={product.image}
                alt={product.name}
                width={80}
                height={80}
                loading="lazy"
                className="size-20 rounded-md object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.size}</p>
                <p className="mt-auto text-sm font-bold">{taka(product.price * qty)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  aria-label={`Remove ${product.name}`}
                  onClick={() => remove(product.slug)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
                <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                  <button
                    aria-label={`Decrease ${product.name} quantity`}
                    onClick={() => setQty(product.slug, qty - 1)}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-4 text-center text-xs font-semibold">{qty}</span>
                  <button
                    aria-label={`Increase ${product.name} quantity`}
                    // Stock is live, so the stepper can stop at what's actually available.
                    disabled={qty >= Math.min(product.stock, MAX_QTY_PER_LINE)}
                    className="disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => setQty(product.slug, qty + 1)}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-border p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{taka(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery (inside Dhaka)</span>
            <span className="font-semibold">{taka(DELIVERY_INSIDE_DHAKA)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>Total</span>
            <span>{taka(subtotal ? subtotal + DELIVERY_INSIDE_DHAKA : 0)}</span>
          </div>
          <Button className="w-full" size="lg" disabled={lines.length === 0} asChild>
            <Link to="/checkout" onClick={() => setOpen(false)}>
              Checkout
            </Link>
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Pay with bKash or card · 100% secure payments
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
