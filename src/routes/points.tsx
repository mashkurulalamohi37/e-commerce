import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";

import { BRAND_NAME } from "@/lib/catalog";

const steps = [
  {
    title: "Earn",
    body: "Get 1 point for every ৳100 spent. Points accrue only on successfully completed orders.",
  },
  {
    title: "Wait",
    body: "Online order points post within 21 days. Showroom purchases post within 24 hours.",
  },
  {
    title: "Redeem",
    body: "Convert points into vouchers, including free-delivery vouchers, at checkout.",
  },
];

export const Route = createFileRoute("/points")({
  head: () => ({
    meta: [
      { title: "Loyalty Points & Vouchers — Nills Mart Bangladesh" },
      {
        name: "description",
        content:
          "Earn 1 point per ৳100 spent and redeem points for vouchers including free delivery.",
      },
      { property: "og:title", content: "Loyalty Points & Vouchers — Nills Mart" },
      { property: "og:description", content: "How earning and redeeming Nills Mart points works." },
    ],
  }),
  component: Points,
});

function Points() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold">Loyalty points</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        How earning and redeeming works at {BRAND_NAME}.
      </p>

      {/* The page described a live programme, but no balance is shown anywhere
          and checkout has no redemption step. Say so rather than imply it works. */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-surface p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-sm text-warning">
          <span className="font-semibold">Coming soon.</span> Points are not being issued or
          redeemed yet — balances and checkout redemption arrive with the next release. Orders you
          place now still count once the programme opens.
        </p>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="font-display text-base font-semibold">
              {i + 1}. {s.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
        Points have no cash value and cannot be transferred between accounts.
      </div>
    </div>
  );
}
