import { createFileRoute, Link } from "@tanstack/react-router";

import {
  BRAND_NAME,
  CONTACT,
  DELIVERY_INSIDE_DHAKA,
  DELIVERY_OUTSIDE_DHAKA,
  taka,
} from "@/lib/catalog";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms & Conditions — ${BRAND_NAME}` },
      {
        name: "description",
        content: `The terms that apply when you order from ${BRAND_NAME}.`,
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  const sections = [
    {
      title: "Ordering",
      body: [
        "Placing an order is an offer to buy. We accept it when we confirm the order and take payment, or when we accept a cash-on-delivery order.",
        "Stock is checked again at the moment of payment. If an item sells out between you adding it and paying for it, we will tell you before taking any money.",
      ],
    },
    {
      title: "Prices and payment",
      body: [
        "All prices are in Bangladeshi Taka and include VAT. Delivery is charged separately.",
        "We accept bKash, major debit and credit cards, and cash on delivery. For cash on delivery you pay the courier when the parcel arrives.",
      ],
    },
    {
      title: "Delivery",
      body: [
        `Delivery is ${taka(DELIVERY_INSIDE_DHAKA)} inside Dhaka and ${taka(DELIVERY_OUTSIDE_DHAKA)} outside Dhaka, carried by third-party couriers.`,
        "Orders inside Dhaka usually arrive in 1–2 working days and outside Dhaka in 3–5. These are estimates, not guarantees — courier delays and weather can extend them.",
      ],
    },
    {
      title: "Returns and refunds",
      body: [
        "Damaged, defective or wrong items can be reported within 3 days of delivery. Keep the packaging and send us a photograph so we can arrange a replacement or refund.",
        "Used, liquid, semi-liquid and clearance items cannot be returned, for hygiene reasons.",
        "Approved refunds are returned by the method you paid with, within 7 to 10 working days of us receiving the item back.",
      ],
    },
    {
      title: "Product information",
      body: [
        "Every item is sourced through authorised channels and quality-inspected before dispatch. Colours can look different between screens and in different light.",
        "Nothing on this site is medical advice. Patch-test new products and consult a professional if you have a skin condition.",
      ],
    },
    {
      title: "Accounts",
      body: [
        "You are responsible for keeping your password to yourself. Tell us straight away if you think someone else has access to your account.",
        "We can suspend an account that is being used fraudulently or abusively.",
      ],
    },
    {
      title: "Promotional codes",
      body: [
        "Promo codes apply to the order subtotal, not to the delivery charge, and cannot be exchanged for cash. Any minimum-order amount is shown when the code is applied. We can withdraw a code at any time.",
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-link">
          Home
        </Link>
        <span className="px-1">/</span>
        <span className="text-foreground">Terms &amp; conditions</span>
      </nav>

      <h1 className="mt-2 font-display text-2xl font-semibold">Terms &amp; conditions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        These terms apply when you order from {BRAND_NAME}.
      </p>

      <div className="mt-6 space-y-6">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-base font-semibold">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-2 text-sm text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2 className="font-display text-base font-semibold">Getting in touch</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Email{" "}
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-link underline-offset-4 hover:underline"
            >
              {CONTACT.email}
            </a>{" "}
            or call{" "}
            <a
              href={`tel:${CONTACT.phone}`}
              className="text-link underline-offset-4 hover:underline"
            >
              {CONTACT.phone}
            </a>
            . See the{" "}
            <Link to="/help" className="text-link underline-offset-4 hover:underline">
              Help centre
            </Link>{" "}
            for common questions and the{" "}
            <Link to="/privacy" className="text-link underline-offset-4 hover:underline">
              privacy policy
            </Link>{" "}
            for how we handle your data.
          </p>
        </section>
      </div>

      <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
        These terms are a plain-language draft prepared for the {BRAND_NAME} storefront. Have them
        reviewed by a qualified lawyer before relying on them commercially.
      </p>
    </div>
  );
}
