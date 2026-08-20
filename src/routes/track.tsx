import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
  Copy,
  Clock,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Printer,
  Search,
  ArrowRight,
  HelpCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import { ApiError } from "@/lib/api-client";
import { trackOrder } from "@/lib/order-api";
import { rememberedEmail, rememberedPhone } from "@/lib/order-session";
import { taka, BRAND_NAME } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, fieldProps } from "@/components/ui/form-field";
import { PrintableReceipt } from "@/components/storefront/PrintableReceipt";

type Search = { order?: string; phone?: string; email?: string };

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    order: typeof search.order === "string" ? search.order : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Live Order Tracking — ${BRAND_NAME}` },
      {
        name: "description",
        content: "Track your Nills Mart package in real-time with live courier updates, status timeline, and order receipts.",
      },
      { property: "og:title", content: `Track Your Order — ${BRAND_NAME}` },
      {
        property: "og:description",
        content: "Live real-time delivery tracking and status verification.",
      },
    ],
  }),
  component: TrackPage,
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
  cancelled: {
    label: "Cancelled",
    desc: "This order was cancelled.",
    icon: XCircle,
  },
};

const TIMELINE_STEPS = ["pending", "processing", "shipped", "delivered"] as const;

function TrackPage() {
  const { order: orderFromUrl, phone: phoneFromUrl, email: emailFromUrl } = Route.useSearch();
  const { user } = useAuth();

  // If order number is in URL, auto-load that order; otherwise start in search mode
  const [orderNumber, setOrderNumber] = useState(orderFromUrl || "");
  const [contact, setContact] = useState(
    phoneFromUrl ||
      emailFromUrl ||
      (orderFromUrl ? rememberedPhone(orderFromUrl) || rememberedEmail(orderFromUrl) : "") ||
      user?.phone ||
      user?.email ||
      "",
  );

  const [lookup, setLookup] = useState<{ order: string; contact: string } | null>(
    orderFromUrl ? { order: orderFromUrl.trim().toUpperCase(), contact: phoneFromUrl || emailFromUrl || (rememberedPhone(orderFromUrl) || rememberedEmail(orderFromUrl) || "") } : null,
  );

  // Sync lookup when URL changes
  useEffect(() => {
    if (orderFromUrl) {
      const cleanOrder = orderFromUrl.trim().toUpperCase();
      const c =
        phoneFromUrl ||
        emailFromUrl ||
        rememberedPhone(cleanOrder) ||
        rememberedEmail(cleanOrder) ||
        user?.phone ||
        user?.email ||
        "";
      setOrderNumber(cleanOrder);
      setContact(c);
      setLookup({ order: cleanOrder, contact: c });
    }
  }, [orderFromUrl, phoneFromUrl, emailFromUrl, user]);

  const query = useQuery({
    queryKey: ["order", lookup?.order, lookup?.contact],
    enabled: Boolean(lookup?.order),
    retry: false,
    refetchInterval: (q) =>
      q.state.data && !["delivered", "cancelled"].includes(q.state.data.status) ? 15_000 : false,
    queryFn: () => trackOrder(lookup!.order, lookup!.contact),
  });

  const notFound = query.isError && (query.error as ApiError)?.status === 404;

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOrder = orderNumber.trim().toUpperCase();
    const cleanContact = contact.trim();

    if (!cleanOrder) {
      toast.error("Please enter an Order Number (e.g. NM-XXXXXXXXXX)");
      return;
    }

    setLookup({ order: cleanOrder, contact: cleanContact });
  };

  const copyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    toast.success(`Copied order number ${num} to clipboard`);
  };

  const quickTrack = (orderNum: string, phoneOrEmail?: string | null) => {
    const cleanNum = orderNum.trim().toUpperCase();
    const targetContact = phoneOrEmail || contact || user?.phone || user?.email || "";
    setOrderNumber(cleanNum);
    setContact(targetContact);
    setLookup({ order: cleanNum, contact: targetContact });
  };

  const handleResetSearch = () => {
    setLookup(null);
    setOrderNumber("");
    setContact(user?.phone || user?.email || "");
  };

  const currentStatus = query.data?.status || "pending";
  const currentStepIndex = TIMELINE_STEPS.indexOf(currentStatus as (typeof TIMELINE_STEPS)[number]);
  const isCancelled = currentStatus === "cancelled";

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/15 to-background pb-16 pt-5 sm:pt-8 print:hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Top Tracking Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-2xs">
                <Truck className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Live Order Tracking
                </h1>
                <p className="text-xs text-muted-foreground">
                  Real-time package status and courier updates for Nills Mart orders.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lookup && (
                <Button
                  variant="outline"
                  size="compact"
                  onClick={handleResetSearch}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Search className="size-3.5 text-primary" />
                  Track Another Order
                </Button>
              )}
              {query.data && !["delivered", "cancelled"].includes(query.data.status) && (
                <button
                  type="button"
                  onClick={() => query.refetch()}
                  disabled={query.isFetching}
                  title="Refresh live tracking"
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className={`size-3 text-primary ${query.isFetching ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Box — Shown when no order is selected or when lookup failed */}
          {(!lookup || notFound || query.isError) && (
            <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-border/80 bg-card p-5 shadow-card transition-all sm:p-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Search className="size-4 text-primary" />
                  Enter Your Order Details
                </h2>
              </div>

              <form onSubmit={handleTrackSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="track-order-no"
                    label="Order Number"
                    required
                    hint="e.g. NM-XXXXXXXXXX"
                  >
                    <Input
                      {...fieldProps("track-order-no", undefined, "e.g. NM-XXXXXXXXXX")}
                      required
                      placeholder="NM-XXXXXXXXXX"
                      className="font-mono text-sm uppercase tracking-wider"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                    />
                  </FormField>

                  <FormField
                    id="track-contact"
                    label="Mobile or Email"
                    hint="Optional — phone or email for extra verification"
                  >
                    <Input
                      {...fieldProps("track-contact", undefined, "Phone or email (optional)")}
                      placeholder="017XXXXXXXX or you@mail.com"
                      className="text-sm"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
                  <p className="text-[11px] text-muted-foreground">
                    Order number is provided on your SMS confirmation & email receipt.
                  </p>
                  <Button type="submit" size="default" className="min-w-32 font-semibold shadow-xs" disabled={query.isFetching}>
                    {query.isFetching ? "Locating…" : "Track Order"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Loading State */}
          {query.isPending && lookup?.order && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
              <Truck className="mx-auto size-8 text-primary animate-bounce" />
              <p className="mt-3 font-display text-base font-semibold text-foreground">
                Retrieving live tracking for order {lookup.order}…
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Connecting to live courier dispatcher</p>
            </div>
          )}

          {/* Not Found Alert */}
          {notFound && (
            <div
              role="alert"
              className="mx-auto mb-6 max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive shadow-sm"
            >
              <p className="font-semibold">Order not found ({orderNumber || lookup?.order})</p>
              <p className="mt-1 text-xs text-destructive/85">
                Please double check your <strong>Order Number</strong>. If you placed the order with a specific mobile number or email, please include it in the field above.
              </p>
            </div>
          )}

          {/* Generic Error */}
          {query.isError && !notFound && (
            <div
              role="alert"
              className="mx-auto mb-6 max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {(query.error as Error).message || "Could not retrieve order details. Please try again."}
            </div>
          )}

        {/* Main Live Tracking Visualizer & Order Details */}
        {query.data && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Top Order Status Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Order Reference
                    </span>
                    <button
                      type="button"
                      onClick={() => copyOrderNumber(query.data.order_number)}
                      title="Copy order number"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-link hover:bg-accent"
                    >
                      <Copy className="size-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <h2 className="mt-0.5 font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {query.data.order_number}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    Placed on {new Date(query.data.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  {/* Active Polling Pulse */}
                  {!["delivered", "cancelled"].includes(query.data.status) && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-success"></span>
                      </span>
                      <span>Live tracking active</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      query.data.status === "delivered"
                        ? "bg-success-surface text-success border border-success/30"
                        : query.data.status === "cancelled"
                          ? "bg-destructive/10 text-destructive border border-destructive/30"
                          : "bg-info-surface text-info border border-info/30"
                    }`}
                  >
                    {STATUS_DETAILS[query.data.status]?.label || query.data.status}
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              {isCancelled ? (
                <div className="my-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                  <XCircle className="mx-auto size-8 text-destructive" />
                  <p className="mt-2 font-display text-base font-bold text-destructive">
                    This order has been cancelled
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Reserved stock has been returned to the catalog. If you paid online, our team will process your refund.
                  </p>
                </div>
              ) : (
                <div className="my-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Delivery Milestones
                  </h3>

                  <div className="relative">
                    {/* Desktop Horizontal Stepper */}
                    <div className="hidden sm:grid sm:grid-cols-4 sm:gap-2">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const StepIcon = STATUS_DETAILS[step].icon;

                        return (
                          <div key={step} className="relative flex flex-col items-center text-center">
                            {/* Step Icon Badge */}
                            <div
                              className={`z-10 mb-2.5 flex size-10 items-center justify-center rounded-full border-2 transition-all ${
                                isDone
                                  ? "border-success bg-success text-white shadow-md shadow-success/20"
                                  : "border-border bg-card text-muted-foreground"
                              } ${isCurrent ? "ring-4 ring-success/20 scale-110" : ""}`}
                            >
                              <StepIcon className="size-5" />
                            </div>

                            {/* Text labels */}
                            <p
                              className={`text-xs font-bold leading-tight ${
                                isDone ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {STATUS_DETAILS[step].label}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                              {STATUS_DETAILS[step].desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stepper Connecting Bar */}
                    <div className="hidden sm:block absolute top-5 left-[12.5%] right-[12.5%] -z-0 h-1 bg-muted rounded-full">
                      <div
                        className="h-full bg-success transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, (currentStepIndex / 3) * 100))}%`,
                        }}
                      />
                    </div>

                    {/* Mobile Vertical Stepper */}
                    <div className="sm:hidden space-y-4">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const StepIcon = STATUS_DETAILS[step].icon;

                        return (
                          <div key={step} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                                  isDone
                                    ? "border-success bg-success text-white"
                                    : "border-border bg-card text-muted-foreground"
                                } ${isCurrent ? "ring-4 ring-success/20" : ""}`}
                              >
                                <StepIcon className="size-4" />
                              </div>
                              {idx < TIMELINE_STEPS.length - 1 && (
                                <div
                                  className={`w-0.5 grow mt-1 mb-1 ${
                                    idx < currentStepIndex ? "bg-success" : "bg-muted"
                                  }`}
                                />
                              )}
                            </div>
                            <div className="pb-3">
                              <p
                                className={`text-xs font-bold ${
                                  isDone ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {STATUS_DETAILS[step].label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {STATUS_DETAILS[step].desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2-Column Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Recipient & Payment Details */}
              <div className="space-y-6">
                {/* Recipient & Destination Card */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h3 className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                    <MapPin className="size-4 text-primary" />
                    Delivery Destination
                  </h3>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">Recipient Name</span>
                      <span className="font-semibold text-foreground">{query.data.customer_name}</span>
                    </div>

                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">Mobile Contact</span>
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Phone className="size-3 text-muted-foreground" />
                        {query.data.phone}
                      </span>
                    </div>

                    {query.data.email && (
                      <div className="flex justify-between border-b border-border/60 pb-2">
                        <span className="text-muted-foreground">Email Updates</span>
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Mail className="size-3 text-link" />
                          {query.data.email}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">Delivery Zone</span>
                      <span className="font-semibold capitalize text-foreground">
                        {query.data.delivery_zone.replace("_", " ")}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-muted-foreground">Address:</span>
                      <p className="mt-1 rounded-lg bg-muted/50 p-2.5 font-medium text-foreground">
                        {query.data.address}, {query.data.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Information Card */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h3 className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                    <CreditCard className="size-4 text-primary" />
                    Payment Information
                  </h3>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">Method</span>
                      <span className="font-bold uppercase tracking-wider text-foreground">
                        {query.data.payment_method}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">Payment Status</span>
                      <span
                        className={`font-semibold capitalize ${
                          query.data.payment_status === "paid"
                            ? "text-success"
                            : "text-warning"
                        }`}
                      >
                        {query.data.payment_status}
                      </span>
                    </div>

                    {query.data.payment_reference && (
                      <div className="flex justify-between pt-1">
                        <span className="text-muted-foreground">Payment Ref</span>
                        <span className="font-mono text-[11px] font-semibold text-foreground">
                          {query.data.payment_reference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Support Helpline Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <HelpCircle className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Need Assistance with your Delivery?
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Our customer care team is available 10 AM – 9 PM daily to assist with address changes or courier updates.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild size="compact" variant="outline" className="text-xs">
                          <Link to="/help">Help Center & FAQ</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Items & Pricing Breakdown */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h3 className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                    <Package className="size-4 text-primary" />
                    Ordered Items ({query.data.items.length})
                  </h3>

                  <ul className="mt-3 divide-y divide-border/70 border-b border-border/70">
                    {query.data.items.map((item) => (
                      <li key={item.id} className="py-2.5 flex justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Qty: <span className="font-medium text-foreground">{item.qty}</span>
                            {item.size ? ` · Size: ${item.size}` : ""}
                            {" · "}
                            {taka(item.unit_price)} each
                          </p>
                        </div>
                        <span className="shrink-0 font-bold tabular-nums text-foreground">
                          {taka(item.unit_price * item.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Financial Breakdown */}
                  <dl className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums font-medium text-foreground">
                        {taka(query.data.subtotal)}
                      </dd>
                    </div>

                    <div className="flex justify-between text-muted-foreground">
                      <dt>Delivery Charge</dt>
                      <dd className="tabular-nums font-medium text-foreground">
                        {taka(query.data.delivery_fee)}
                      </dd>
                    </div>

                    {query.data.discount_amount > 0 && (
                      <div className="flex justify-between text-success">
                        <dt className="flex items-center gap-1">
                          <Sparkles className="size-3" />
                          <span>Promo Discount</span>
                        </dt>
                        <dd className="tabular-nums font-bold">
                          −{taka(query.data.discount_amount)}
                        </dd>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-border pt-2.5 text-sm font-bold text-foreground">
                      <dt>Total Amount</dt>
                      <dd className="tabular-nums text-primary font-black text-base">
                        {taka(query.data.total)}
                      </dd>
                    </div>
                  </dl>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col gap-2 pt-2 border-t border-border sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => window.print()}
                      className="flex-1 gap-1.5 text-xs font-semibold"
                    >
                      <Printer className="size-3.5" />
                      Print Receipt
                    </Button>

                    <Button asChild size="default" className="flex-1 gap-1.5 text-xs font-semibold">
                      <Link to="/">
                        Continue Shopping
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Printable Customer Invoice / Receipt */}
    {query.data && <PrintableReceipt order={query.data} />}
  </>
  );
}
