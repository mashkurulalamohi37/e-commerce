import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Package,
  Truck,
  Home,
  Mail,
  MapPin,
  Copy,
  Printer,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { trackOrder } from "@/lib/order-api";
import { rememberedEmail, rememberedPhone } from "@/lib/order-session";
import { taka, BRAND_NAME } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { PrintableReceipt } from "@/components/storefront/PrintableReceipt";

type Search = { order?: string; phone?: string; email?: string };

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    order: typeof search.order === "string" ? search.order : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Order Confirmed & Live Tracking — ${BRAND_NAME}` },
      { name: "description", content: "Your order has been placed successfully. View live delivery tracking." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmed,
});

const STATUS_DETAILS: Record<
  string,
  { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "Order Placed",
    desc: "We received your order and payment details.",
    icon: CheckCircle2,
  },
  processing: {
    label: "Packed & Sealed",
    desc: "Quality-checked and safely packaged in our warehouse.",
    icon: Package,
  },
  shipped: {
    label: "On the Way",
    desc: "Handed to courier for delivery (1–2 days inside Dhaka, 3–5 days outside).",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    desc: "Package successfully handed over to recipient.",
    icon: Home,
  },
};

const TIMELINE_STEPS = ["pending", "processing", "shipped", "delivered"] as const;

function OrderConfirmed() {
  const { order: orderNumber, phone: phoneFromUrl, email: emailFromUrl } = Route.useSearch();
  const contact =
    phoneFromUrl ||
    emailFromUrl ||
    (orderNumber ? rememberedPhone(orderNumber) || rememberedEmail(orderNumber) : "");

  const { data: order, isPending } = useQuery({
    queryKey: ["order", orderNumber, contact],
    enabled: Boolean(orderNumber),
    retry: false,
    refetchInterval: (q) =>
      q.state.data && !["delivered", "cancelled"].includes(q.state.data.status) ? 15_000 : false,
    queryFn: () => trackOrder(orderNumber!, contact),
  });

  const copyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    toast.success(`Copied order number ${num} to clipboard`);
  };

  // Reached without an order number
  if (!orderNumber) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">No order to show</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If you have just ordered, check your SMS or email for the order number and look it up.
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

  const currentStatus = order?.status || "pending";
  const currentStepIndex = TIMELINE_STEPS.indexOf(currentStatus as (typeof TIMELINE_STEPS)[number]);
  const isCod = order?.payment_method === "cod";

  return (
    <>
      {/* On-screen Visual Presentation */}
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/15 to-background pb-10 pt-5 sm:pt-8 print:hidden">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center">
            <div className="mx-auto mb-3 grid size-13 place-items-center rounded-full bg-success-surface text-success shadow-xs ring-4 ring-success/10 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="size-6.5" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
              Thank you — your order is confirmed!
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              Order Reference:{" "}
              <span className="font-mono font-bold text-foreground">
                {orderNumber.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => copyOrderNumber(orderNumber)}
                title="Copy reference"
                className="ml-1.5 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold text-link hover:bg-accent"
              >
                <Copy className="size-3" />
                <span>Copy</span>
              </button>
            </p>

            {/* Dynamic Notification Indicators */}
            {order && (
              <div className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs text-muted-foreground shadow-2xs">
                {order.email ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-link" />
                      Receipt emailed to <strong className="font-semibold text-foreground">{order.email}</strong>
                    </span>
                    <span className="hidden opacity-40 sm:inline">•</span>
                    <span className="flex items-center gap-1.5">
                      <Truck className="size-3.5 text-success" />
                      Delivery SMS sent to <strong className="font-semibold text-foreground">{order.phone}</strong>
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Truck className="size-3.5 text-success" />
                    Live delivery & tracking SMS sent to <strong className="font-semibold text-foreground">{order.phone}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Live Delivery Milestones Tracking Card */}
          <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5 animate-in fade-in-50 duration-300">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Live Delivery Milestones
                </h2>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-success"></span>
                </span>
                <span>Live tracking active</span>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="my-6">
              {/* Desktop Stepper */}
              <div className="hidden sm:grid sm:grid-cols-4 sm:gap-2">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const StepIcon = STATUS_DETAILS[step].icon;

                  return (
                    <div key={step} className="relative flex flex-col items-center text-center">
                      <div
                        className={`z-10 mb-2 flex size-10 items-center justify-center rounded-full border-2 transition-all ${
                          isDone
                            ? "border-success bg-success text-white shadow-md shadow-success/20"
                            : "border-border bg-card text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-success/20 scale-105" : ""}`}
                      >
                        <StepIcon className="size-5" />
                      </div>
                      <p className={`text-xs font-bold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                        {STATUS_DETAILS[step].label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                        {STATUS_DETAILS[step].desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Connecting Bar */}
              <div className="hidden sm:block relative -top-15 mx-[12.5%] -z-0 h-1 bg-muted rounded-full">
                <div
                  className="h-full bg-success transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentStepIndex / 3) * 100))}%`,
                  }}
                />
              </div>

              {/* Mobile Stepper */}
              <div className="sm:hidden space-y-3">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const StepIcon = STATUS_DETAILS[step].icon;

                  return (
                    <div key={step} className="flex gap-3 items-start">
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
                          isDone ? "border-success bg-success text-white" : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        <StepIcon className="size-3.5" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                          {STATUS_DETAILS[step].label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{STATUS_DETAILS[step].desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recipient & Courier Window Banner */}
            {order && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span>
                    Delivering to <strong className="text-foreground">{order.customer_name}</strong> at{" "}
                    <strong className="text-foreground">{order.address}, {order.city}</strong>
                  </span>
                </div>
                <span className="shrink-0 font-semibold text-primary">
                  {order.delivery_zone === "inside_dhaka" ? "1–2 days inside Dhaka" : "3–5 days outside Dhaka"}
                </span>
              </div>
            )}
          </div>

          {/* Order Details & Receipt Card */}
          {order ? (
            <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6 text-xs text-foreground">
              <h3 className="font-display text-sm font-bold flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Order Summary ({order.items.length} items)
              </h3>

              <ul className="mt-3 space-y-2 border-b border-border/70 pb-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate text-muted-foreground">
                      <strong className="text-foreground">{item.name}</strong> × {item.qty}
                      {item.size ? ` (${item.size})` : ""}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">
                      {taka(item.unit_price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-3 space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums font-medium text-foreground">{taka(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Delivery Fee ({order.delivery_zone.replace("_", " ")})</dt>
                  <dd className="tabular-nums font-medium text-foreground">{taka(order.delivery_fee)}</dd>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt className="flex items-center gap-1">
                      <Sparkles className="size-3" />
                      <span>Promo Discount</span>
                    </dt>
                    <dd className="tabular-nums font-bold">−{taka(order.discount_amount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums text-primary font-black text-base">{taka(order.total)}</dd>
                </div>
              </dl>

              <div className="mt-3 pt-2.5 border-t border-border/70 flex justify-between items-center text-muted-foreground">
                <span>Payment method: <strong className="uppercase text-foreground">{order.payment_method}</strong> ({order.payment_status})</span>
                {isCod && <span className="font-semibold text-foreground">Pay courier on delivery</span>}
              </div>
            </div>
          ) : isPending ? (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground shadow-card">
              Loading order details…
            </div>
          ) : null}

          {/* Quick Action Navigation Buttons */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Button asChild size="default" className="flex-1 font-semibold shadow-xs">
              <Link to="/track" search={{ order: orderNumber, phone: order?.phone || phoneFromUrl }}>
                <Truck className="mr-1.5 size-4" />
                Dedicated Live Tracking
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => window.print()}
              className="flex-1 font-semibold shadow-xs"
            >
              <Printer className="mr-1.5 size-4" />
              Print Receipt
            </Button>

            <Button asChild variant="secondary" size="default" className="flex-1 font-semibold">
              <Link to="/">
                Continue Shopping
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Official Print Receipt (Displayed only on print / PDF) */}
      {order && <PrintableReceipt order={order} />}
    </>
  );
}
