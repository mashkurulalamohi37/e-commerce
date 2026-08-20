import { ShieldCheck, Truck, Lock, Headphones } from "lucide-react";

const items = [
  { icon: ShieldCheck, lead: "100% Authentic", label: "Genuine Brand Guarantee" },
  { icon: Truck, lead: "৳79 Fast Delivery", label: "Across Dhaka City" },
  { icon: Lock, lead: "Safe Checkout", label: "COD & Digital Payments" },
  { icon: Headphones, lead: "Expert Support", label: "10 AM – 10 PM Everyday" },
];

/** Full-width trust & customer guarantee band */
export function TrustBand() {
  return (
    <section className="mt-8 sm:mt-12 border-t border-emerald-950/20 bg-gradient-to-r from-[#082228] via-[#0b2f37] to-[#082228] text-white shadow-inner">
      <div className="mx-auto max-w-7xl px-4 py-4.5 sm:px-6 sm:py-5 lg:px-8">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {items.map(({ icon: Icon, lead, label }, i) => (
            <li
              key={label}
              className={`flex items-center gap-3.5 justify-start sm:justify-center ${
                i > 0 ? "sm:border-l sm:border-white/15 sm:pl-6" : ""
              }`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-emerald-300 ring-1 ring-emerald-400/30 shadow-md">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 leading-snug">
                <span className="block text-sm sm:text-base font-extrabold text-white tracking-tight">{lead}</span>
                <span className="block text-xs sm:text-[13px] text-emerald-100/75 font-medium">{label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

