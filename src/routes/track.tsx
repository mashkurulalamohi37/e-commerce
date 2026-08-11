import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { trackOrder } from "@/lib/order-api";
import { rememberedPhone } from "@/lib/order-session";
import { taka } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, fieldProps } from "@/components/ui/form-field";

type Search = { order?: string };

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    order: typeof search.order === "string" ? search.order : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track Your Order — Nills Mart Bangladesh" },
      {
        name: "description",
        content: "Check the payment and delivery status of your Nills Mart order.",
      },
      { property: "og:title", content: "Track Your Order — Nills Mart" },
      {
        property: "og:description",
        content: "Live payment and delivery status for your Nills Mart order.",
      },
    ],
  }),
  component: Track,
});

const STATUS_COPY: Record<string, string> = {
  pending: "Order received",
  processing: "Being packed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The happy path, in order. `cancelled` is handled separately. */
const STEPS = ["pending", "processing", "shipped", "delivered"] as const;

function Track() {
  const { order: orderFromUrl } = Route.useSearch();

  const initialPhone = orderFromUrl ? rememberedPhone(orderFromUrl) : "";
  const [orderNumber, setOrderNumber] = useState(orderFromUrl ?? "");
  const [phone, setPhone] = useState(initialPhone);
  // Look up automatically only when checkout already gave us the phone.
  const [lookup, setLookup] = useState<{ order: string; phone: string } | null>(
    orderFromUrl && initialPhone ? { order: orderFromUrl, phone: initialPhone } : null,
  );

  const query = useQuery({
    queryKey: ["order", lookup?.order, lookup?.phone],
    enabled: Boolean(lookup),
    retry: false,
    // Poll while it's still moving; stop once it's done.
    refetchInterval: (q) =>
      q.state.data && !["delivered", "cancelled"].includes(q.state.data.status) ? 15_000 : false,
    queryFn: () => trackOrder(lookup!.order, lookup!.phone),
  });

  const notFound = query.isError && (query.error as ApiError)?.status === 404;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Order status</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your order number and the mobile number you ordered with.
      </p>

      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setLookup({ order: orderNumber.trim().toUpperCase(), phone: phone.trim() });
        }}
      >
        <FormField
          id="track-order"
          label="Order number"
          required
          hint="On your SMS confirmation, e.g. NM-4K92XR10AZ."
        >
          <Input
            {...fieldProps(
              "track-order",
              undefined,
              "On your SMS confirmation, e.g. NM-4K92XR10AZ.",
            )}
            required
            placeholder="NM-XXXXXXXXXX"
            className="font-mono uppercase"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </FormField>
        <FormField id="track-phone" label="Mobile number" required>
          <Input
            {...fieldProps("track-phone")}
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="01712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={query.isFetching}>
          {query.isFetching ? "Checking…" : "Track order"}
        </Button>
      </form>

      {notFound && (
        // Was muted grey with no role, while the rarer generic error got the
        // loud treatment — the common failure was the quietest thing on screen.
        <p
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          No order matches that number and mobile number. Check both — the order number is on your
          SMS confirmation and looks like NM-XXXXXXXXXX.
        </p>
      )}

      {query.isError && !notFound && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      )}

      {query.data && (
        <div className="mt-5 space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-display text-lg font-semibold">{query.data.order_number}</p>
          <p>
            Payment: <span className="font-semibold capitalize">{query.data.payment_status}</span>{" "}
            via {query.data.payment_method}
          </p>
          {/* Status was a sentence. This is the thing people open the page for. */}
          {query.data.status === "cancelled" ? (
            <p role="status" className="font-semibold text-destructive">
              This order was cancelled.
            </p>
          ) : (
            <ol className="flex items-center gap-1" aria-label="Delivery progress">
              {STEPS.map((step, i) => {
                const current = STEPS.indexOf(query.data.status as (typeof STEPS)[number]);
                const done = i <= current;
                return (
                  <li key={step} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className={`h-1.5 w-full rounded-full ${done ? "bg-success" : "bg-muted"}`}
                    />
                    <span
                      className={`text-center text-[10px] font-semibold leading-tight ${
                        i === current ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {STATUS_COPY[step]}
                      {i === current && <span className="sr-only"> — current status</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="text-muted-foreground">Delivering to {query.data.city}</p>
          <ul className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
            {query.data.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {item.name} × {item.qty}
                </span>
                <span className="shrink-0">{taka(item.unit_price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>{taka(query.data.total)}</span>
          </p>
        </div>
      )}

      <Button asChild variant="secondary" className="mt-6 w-full">
        <Link to="/">Back to store</Link>
      </Button>
    </div>
  );
}
