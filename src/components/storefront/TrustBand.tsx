import { ShieldCheck, Truck, Lock, Headphones } from "lucide-react";

const items = [
  { icon: ShieldCheck, lead: "100%", label: "Genuine Products" },
  { icon: Truck, lead: "৳79", label: "Dhaka Delivery" },
  { icon: Lock, lead: "100%", label: "Secure Payments" },
  { icon: Headphones, lead: "Free", label: "Beauty Help Center" },
];

/** Full-width promise band shown directly above the site footer. */
export function TrustBand() {
  return (
    <section className="mt-14 bg-band text-band-foreground">
      <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-y-6 px-4 py-6 sm:py-8">
        {items.map(({ icon: Icon, lead, label }, i) => (
          <li
            key={label}
            className={`flex w-1/2 items-center justify-center gap-3 px-2 sm:w-1/4 ${
              i > 0 ? "sm:border-l sm:border-band-foreground/25" : ""
            }`}
          >
            <span className="badge-scallop grid size-11 shrink-0 place-items-center bg-band-accent sm:size-14">
              <Icon className="size-5 text-band-accent-foreground sm:size-6" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-lg font-bold sm:text-xl">{lead}</span>
              <span className="block text-[11px] font-bold uppercase tracking-wide sm:text-xs">
                {label}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
