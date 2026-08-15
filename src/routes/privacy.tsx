import { createFileRoute, Link } from "@tanstack/react-router";

import { BRAND_NAME, CONTACT } from "@/lib/catalog";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${BRAND_NAME}` },
      {
        name: "description",
        content: `How ${BRAND_NAME} collects, uses and protects your personal information.`,
      },
    ],
  }),
  component: Privacy,
});

const SECTIONS = [
  {
    title: "What we collect",
    body: [
      "To deliver an order we collect your name, mobile number, delivery address and city. If you create an account we also store your email address.",
      "We record which products you view and order so we can show relevant offers and keep your order history accurate.",
    ],
  },
  {
    title: "Payment information",
    body: [
      "Card and bKash payments are processed by our payment provider. Full card numbers and bKash PINs are never sent to, or stored on, our servers — we keep only a payment reference and whether the payment succeeded.",
    ],
  },
  {
    title: "How we use it",
    body: [
      "To take payment, pack and deliver your order, answer support questions, and send you the delivery updates you asked for.",
      "We do not sell your personal information. We share your name, phone number and address with the courier carrying your parcel, because they cannot deliver it otherwise.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Order records are kept for as long as we are required to for tax and accounting purposes. Account details are kept until you ask us to delete them.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can ask us for a copy of the information we hold about you, ask us to correct it, or ask us to delete your account. Write to us and we will respond within 30 days.",
    ],
  },
  {
    title: "Cookies and local storage",
    body: [
      "We store your cart and your theme preference in your browser so they survive a reload. Signing in stores a session token. None of this is used for advertising.",
    ],
  },
];

function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-link">
          Home
        </Link>
        <span className="px-1">/</span>
        <span className="text-foreground">Privacy policy</span>
      </nav>

      <h1 className="mt-2 font-display text-2xl font-semibold">Privacy policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        How {BRAND_NAME} handles your personal information.
      </p>

      <div className="mt-6 space-y-6">
        {SECTIONS.map((s) => (
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
          <h2 className="font-display text-base font-semibold">Contact us</h2>
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
            . Our address is {CONTACT.address}.
          </p>
        </section>
      </div>

      <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
        This policy is a plain-language summary prepared for the {BRAND_NAME} storefront. Have it
        reviewed against the Bangladesh Digital Security Act and your payment provider's
        requirements before relying on it commercially.
      </p>
    </div>
  );
}
