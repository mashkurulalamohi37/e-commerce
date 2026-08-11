import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTACT } from "@/lib/catalog";

const faqs = [
  {
    id: "delivery-returns",
    q: "How much is delivery and how long does it take?",
    a: "Delivery is ৳79 inside Dhaka and ৳119 outside Dhaka via third-party couriers. Orders inside Dhaka arrive in 1–2 days and outside Dhaka in 3–5 days.",
  },
  {
    id: "payment",
    q: "How can I pay?",
    a: "You can pay with bKash or any major debit/credit card, or with cash on delivery. All online payments are processed over an encrypted, secure connection.",
  },
  {
    id: "returns",
    q: "What is your return policy?",
    a: "Damaged, defective or wrong items can be reported within 3 days of delivery. Electronics have a 15-day replacement window. Used, liquid, semi-liquid and clearance items are not returnable.",
  },
  {
    id: "genuine",
    q: "Are the products genuine?",
    a: "Yes. Every item is sourced from authorised channels, quality-inspected and shipped in a closed box.",
  },
  {
    id: "points",
    q: "How do loyalty points work?",
    a: "You earn 1 point for every ৳100 on successfully completed orders. Online points can take up to 21 days to post; showroom points post within 24 hours. Points can be redeemed for vouchers, including free-delivery vouchers.",
  },
];

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Delivery, Returns & Payments | Nills Mart" },
      {
        name: "description",
        content:
          "Delivery charges, return rules, payment options and order support for Nills Mart customers in Bangladesh.",
      },
      { property: "og:title", content: "Help Center — Nills Mart" },
      {
        property: "og:description",
        content: "Answers on delivery, returns, payments and loyalty points.",
      },
    ],
  }),
  component: Help,
});

function Help() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold">Help centre</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Answers to the most common questions below. If you need a person, our team is available
        10am–8pm, seven days a week.
      </p>

      {/* The page used to open with "Chat with a beauty advisor 10am–8pm" and
          offer no way to reach anyone. These are the channels that exist. */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a
          href={`tel:${CONTACT.phone}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Phone className="size-5 shrink-0 text-link" />
          <span>
            <span className="block text-sm font-semibold text-foreground">Call us</span>
            <span className="block text-xs text-muted-foreground">{CONTACT.phone} · 10am–8pm</span>
          </span>
        </a>
        <a
          href={`mailto:${CONTACT.email}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Mail className="size-5 shrink-0 text-link" />
          <span>
            <span className="block text-sm font-semibold text-foreground">Email us</span>
            <span className="block text-xs text-muted-foreground">
              Replies within one working day
            </span>
          </span>
        </a>
      </div>

      <Accordion type="single" collapsible className="mt-6">
        {faqs.map((f) => (
          <AccordionItem key={f.q} value={f.q} id={f.id}>
            <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        Already ordered?{" "}
        <Link to="/track" className="font-semibold text-link underline-offset-4 hover:underline">
          Track your order
        </Link>{" "}
        with your order number and mobile number.
      </p>
    </div>
  );
}
