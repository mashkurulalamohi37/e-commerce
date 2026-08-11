import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageOpen } from "lucide-react";

import { fetchMyOrders } from "@/lib/order-api";
import { rememberOrderPhone } from "@/lib/order-session";
import { taka, BRAND_NAME } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/storefront/ProductGridStates";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: `Your orders — ${BRAND_NAME}` },
      { name: "description", content: "Every order you have placed, with its current status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

const STATUS_COPY: Record<string, string> = {
  pending: "Order received",
  processing: "Being packed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Delivered reads as settled, cancelled as a problem, anything else in flight. */
function toneFor(status: string) {
  if (status === "delivered") return "bg-success-surface text-success";
  if (status === "cancelled") return "bg-destructive/10 text-destructive";
  return "bg-info-surface text-info";
}

function OrdersPage() {
  const {
    data: orders,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: fetchMyOrders,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold">Your orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything you have ordered while signed in, newest first.
      </p>

      {isPending ? (
        <ProductGridSkeleton count={3} />
      ) : isError ? (
        <div
          role="alert"
          className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
        >
          <p className="font-display text-lg font-semibold">We couldn't load your orders</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Check your connection and try again.
          </p>
          <Button size="sm" className="mt-5" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
          <PackageOpen className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-2 font-display text-lg font-semibold">No orders yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Orders you place while signed in show up here. If you ordered as a guest, look it up
            with your order number instead.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="sm">
              <Link to="/offers">Shop the offers</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/track">Track a guest order</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()} ·{" "}
                    {o.items.reduce((sum, i) => sum + i.qty, 0)} items
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${toneFor(o.status)}`}
                >
                  {STATUS_COPY[o.status] ?? o.status}
                </span>
              </div>

              <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                {o.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {item.name} × {item.qty}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {taka(item.unit_price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <p className="text-sm font-bold tabular-nums">Total {taka(o.total)}</p>
                <Button asChild size="compact" variant="outline">
                  <Link
                    to="/track"
                    search={{ order: o.order_number }}
                    // We already know the phone this order was placed with, so
                    // hand it over rather than making /track ask for it.
                    onClick={() => rememberOrderPhone(o.order_number, o.phone)}
                  >
                    Track this order
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
