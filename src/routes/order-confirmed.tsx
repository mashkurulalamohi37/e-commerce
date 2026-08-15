import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, Truck, Home } from "lucide-react";

import { trackOrder } from "@/lib/order-api";
import { rememberedPhone } from "@/lib/order-session";
import { taka, BRAND_NAME } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

type Search = { order?: string };

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    order: typeof search.order === "string" ? search.order : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Order confirmed — ${BRAND_NAME}` },
      { name: "description", content: "Your order has been placed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmed,
});

const STEPS = [
  {
    icon: CheckCircle2,
    title: "Order received",
    body: "We have your order and the details below.",
  },
  {
    icon: Package,
    title: "Packed within 24 hours",
    body: "Sealed and quality-checked before it leaves us.",
  },
  { icon: Truck, title: "On the way", body: "1–2 days inside Dhaka, 3–5 days outside." },
];

function OrderConfirmed() {
  const { order: orderNumber } = Route.useSearch();
  const phone = orderNumber ? rememberedPhone(orderNumber) : "";

  const { data: order } = useQuery({
    queryKey: ["order", orderNumber, phone],
    enabled: Boolean(orderNumber && phone),
    retry: false,
    queryFn: () => trackOrder(orderNumber!, phone),
  });

  // Reached without an order number — nothing to confirm.
  if (!orderNumber) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">No order to show</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If you have just ordered, check your SMS for the order number and look it up.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link to="/track">Track an order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back to store</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCod = order?.payment_method === "cod";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-success-surface text-success">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Thank you — your order is confirmed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order{" "}
          {/* Printed as-is. This used to re-add the "NM-" prefix to a number that
              already had one and then truncate what was left, so a customer told
              to keep NM-4K92XR10AZ was shown #NM-NM-4K92X — which /track cannot
              find. The API already returns it display-ready. */}
          <span className="font-mono font-semibold text-foreground">
            {orderNumber.toUpperCase()}
          </span>
          . Keep this reference — you need it to track your delivery.
        </p>
        {order && (
          <p className="mt-1 text-sm font-medium text-foreground">
            {isCod
              ? `Pay ${taka(order.total)} to the courier on delivery.`
              : `${taka(order.total)} paid by ${order.payment_method}.`}
          </p>
        )}
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <Icon className={i === 0 ? "size-5 text-success" : "size-5 text-muted-foreground"} />
            <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>

      {order ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm">
          <h2 className="font-display text-base font-semibold">Order summary</h2>
          <ul className="mt-3 space-y-1.5 border-b border-border pb-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.name} × {item.qty}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {taka(item.unit_price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{taka(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">{taka(order.delivery_fee)}</dd>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{taka(order.discount_amount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{taka(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            Delivering to {order.customer_name}, {order.address}, {order.city}.
          </p>
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-card/60 p-4 text-center text-sm text-muted-foreground">
          Your order is placed. Open it any time from{" "}
          <Link to="/track" className="font-semibold text-link underline-offset-4 hover:underline">
            Track order
          </Link>{" "}
          using the order number above and your mobile number.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link to="/track" search={{ order: orderNumber }}>
            Track this order
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/">
            <Home className="mr-1.5 size-4" />
            Continue shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
