import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import {
  payOrder,
  placeOrder,
  validatePromo,
  type DeliveryZone,
  type PaymentMethod,
  type ValidatedPromo,
} from "@/lib/order-api";
import { taka, DELIVERY_INSIDE_DHAKA, DELIVERY_OUTSIDE_DHAKA } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, RequiredLegend, fieldProps } from "@/components/ui/form-field";
import { trackPromoConversion } from "@/lib/analytics";
import { rememberOrderPhone } from "@/lib/order-session";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Pay with bKash or Card | Nills Mart" },
      {
        name: "description",
        content:
          "Complete your Nills Mart order with bKash, card or cash on delivery. Live stock checks before payment.",
      },
      { property: "og:title", content: "Secure Checkout — Nills Mart" },
      {
        property: "og:description",
        content: "bKash, card and cash on delivery with live stock validation.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const BD_PHONE = /^01[3-9]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"customerName" | "phone" | "email" | "address" | "city", string>>;

function Checkout() {
  const navigate = useNavigate();
  const { lines, subtotal, clear, loading } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "Dhaka",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [zone, setZone] = useState<DeliveryZone>("inside_dhaka");
  const [method, setMethod] = useState<PaymentMethod>("bkash");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<ValidatedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | undefined>();
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [busy, setBusy] = useState(false);
  // Identifies this checkout attempt to the API so a retry cannot become a
  // second order. Reset only once an order is successfully placed.
  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.full_name || "",
      phone: prev.phone || user.phone || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  const applyPromo = async () => {
    setCheckingPromo(true);
    setPromoError(undefined);
    try {
      setPromo(await validatePromo(promoCode, subtotal));
    } catch (err) {
      setPromo(null);
      setPromoError((err as ApiError).message || "That code isn't valid.");
    } finally {
      setCheckingPromo(false);
    }
  };

  const deliveryFee = zone === "inside_dhaka" ? DELIVERY_INSIDE_DHAKA : DELIVERY_OUTSIDE_DHAKA;
  // Display only — the server recomputes the charge from its own price data.
  const orderTotal = Math.max(0, subtotal + deliveryFee - (promo?.calculated_discount ?? 0));
  const short = lines.filter((l) => l.qty > l.product.stock);

  // A free-text city and a separate zone toggle could disagree silently — the
  // customer picked "Inside Dhaka · ৳79" with "Chattogram" typed above it.
  const cityLooksDhaka = /dhaka/i.test(form.city.trim());
  const zoneMismatch =
    form.city.trim().length > 2 &&
    ((zone === "inside_dhaka" && !cityLooksDhaka) || (zone === "outside_dhaka" && cityLooksDhaka));

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (form.customerName.trim().length < 2) {
      next.customerName = "Enter the name the courier should ask for.";
    }
    if (!BD_PHONE.test(form.phone.trim())) {
      next.phone = "Enter an 11-digit Bangladeshi mobile number.";
    }
    if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
      next.email = "Enter a valid email address, or leave it blank.";
    }
    if (form.address.trim().length < 5) {
      next.address = "Add a house or road number so the courier can find you.";
    }
    if (form.city.trim().length < 2) {
      next.city = "Enter your city.";
    }
    return next;
  };

  if (loading) {
    return (
      <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading your cart…</p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
        <Button asChild className="mt-6">
          <Link to="/offers">Shop the offers</Link>
        </Button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move the user to the problem rather than describing it in a toast.
      const first = Object.keys(found)[0];
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    if (short.length) {
      toast.error(`${short[0].product.name} only has ${short[0].product.stock} left.`);
      return;
    }

    setBusy(true);
    try {
      trackPromoConversion("checkout_started");

      // The server re-checks stock and recomputes every figure; whatever the
      // browser believed about prices is irrelevant by this point.
      const order = await placeOrder(
        {
          ...form,
          email: form.email.trim() || undefined,
          deliveryZone: zone,
          paymentMethod: method,
          promoCode: promoCode.trim() || undefined,
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        },
        idempotencyKey.current,
      );

      rememberOrderPhone(order.order_number, form.phone, form.email);

      // Cash on delivery is not a payment: no gateway call, nothing marked paid.
      if (method === "cod") {
        clear();
        trackPromoConversion("order_placed", {
          order_total: order.total,
          order_number: order.order_number,
          payment_method: "cod",
        });
        navigate({
          to: "/order-confirmed",
          search: {
            order: order.order_number,
            phone: form.phone,
            email: form.email.trim() || undefined,
          },
        });
        return;
      }

      const paid = await payOrder(order.id, form.phone);

      clear();
      trackPromoConversion("order_placed", {
        order_total: paid.total,
        order_number: paid.order_number,
        payment_method: method,
      });
      navigate({
        to: "/order-confirmed",
        search: {
          order: paid.order_number,
          phone: form.phone,
          email: form.email.trim() || undefined,
        },
      });
    } catch (err) {
      const error = err as ApiError;
      // 409 means someone else bought the last one between adding and paying.
      if (error.status === 409) {
        toast.error(error.message);
      } else {
        toast.error(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold">Checkout</h1>

      <div className="mt-4 space-y-2 rounded-xl border border-border bg-card p-4">
        {lines.map(({ product, qty }) => (
          <div key={product.slug} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {product.name} × {qty}
              {qty > product.stock && (
                <span className="ml-2 font-medium text-destructive">only {product.stock} left</span>
              )}
              {qty <= product.stock && product.stock <= 5 && (
                <span className="ml-2 text-xs text-sale">{product.stock} in stock</span>
              )}
            </span>
            <span className="shrink-0 font-semibold">{taka(product.price * qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span className="font-semibold tabular-nums">{taka(deliveryFee)}</span>
        </div>
        {promo && (
          <div className="flex justify-between text-sm text-success">
            <span>Discount ({promo.code})</span>
            <span className="font-semibold tabular-nums">−{taka(promo.calculated_discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{taka(orderTotal)}</span>
        </div>
      </div>

      <form className="mt-5 space-y-3" onSubmit={submit} noValidate>
        <RequiredLegend />

        <FormField id="co-customerName" label="Full name" required error={errors.customerName}>
          <Input
            {...fieldProps("co-customerName", errors.customerName)}
            autoComplete="name"
            maxLength={120}
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          />
        </FormField>

        <FormField
          id="co-phone"
          label="Mobile number"
          required
          error={errors.phone}
          hint="We text the delivery update to this number."
        >
          <Input
            {...fieldProps("co-phone", errors.phone, "We text the delivery update to this number.")}
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </FormField>

        <FormField
          id="co-email"
          label="Email address"
          error={errors.email}
          hint="Optional — We'll email your order receipt & tracking updates. Delivery SMS is also sent to your mobile number."
        >
          <Input
            {...fieldProps(
              "co-email",
              errors.email,
              "Optional — We'll email your order receipt & tracking updates. Delivery SMS is also sent to your mobile number.",
            )}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com (optional)"
            maxLength={255}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormField>

        <FormField id="co-address" label="Delivery address" required error={errors.address}>
          <Textarea
            {...fieldProps("co-address", errors.address)}
            maxLength={400}
            autoComplete="street-address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </FormField>

        <FormField id="co-city" label="City" required error={errors.city}>
          <Input
            {...fieldProps("co-city", errors.city)}
            maxLength={80}
            autoComplete="address-level2"
            value={form.city}
            onChange={(e) => {
              const city = e.target.value;
              // Keep the zone in step with the city rather than letting the two
              // contradict each other silently.
              setForm({ ...form, city });
              if (/dhaka/i.test(city.trim())) setZone("inside_dhaka");
            }}
          />
        </FormField>

        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1.5 text-sm font-medium">Delivery zone</legend>
          {(
            [
              ["inside_dhaka", `Inside Dhaka · ${taka(DELIVERY_INSIDE_DHAKA)}`],
              ["outside_dhaka", `Outside Dhaka · ${taka(DELIVERY_OUTSIDE_DHAKA)}`],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={zone === value}
              onClick={() => setZone(value)}
              className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                zone === value ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
          {zoneMismatch && (
            <p role="status" className="col-span-2 text-xs font-medium text-warning">
              You entered “{form.city.trim()}” but selected{" "}
              {zone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"}. Check the zone — it sets
              the delivery charge.
            </p>
          )}
        </fieldset>

        <fieldset className="grid grid-cols-3 gap-2">
          <legend className="mb-1.5 text-sm font-medium">Payment method</legend>
          {(
            [
              ["bkash", "bKash"],
              ["card", "Card"],
              ["cod", "Cash on delivery"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={method === value}
              onClick={() => setMethod(value)}
              className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                method === value
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </fieldset>

        {/* The admin could create promo codes but there was no field anywhere
            for a customer to enter one. */}
        <FormField id="co-promo" label="Promo code" error={promoError} hint="Optional.">
          <div className="flex gap-2">
            <Input
              {...fieldProps("co-promo", promoError, "Optional.")}
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoError(undefined);
                setPromo(null);
              }}
              placeholder="WELCOME10"
              className="font-mono uppercase"
              maxLength={32}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!promoCode.trim() || checkingPromo}
              onClick={applyPromo}
            >
              {checkingPromo ? "Checking…" : "Apply"}
            </Button>
          </div>
        </FormField>
        {promo && (
          <p role="status" className="text-xs font-medium text-success">
            {promo.code} applied — {taka(promo.calculated_discount)} off.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy || short.length > 0}>
          {busy
            ? "Processing…"
            : method === "cod"
              ? `Place order · ${taka(orderTotal)} on delivery`
              : `Pay ${taka(orderTotal)}`}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          {method === "cod"
            ? "Stock is re-checked when you place the order. You pay the courier on delivery."
            : "Stock is re-checked at the moment of payment; inventory is reserved only once payment succeeds."}
        </p>
      </form>
    </div>
  );
}
