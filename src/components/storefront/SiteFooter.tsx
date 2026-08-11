import { BRAND_NAME, CONTACT, categories } from "@/lib/catalog";
import { TrustBand } from "./TrustBand";
import { BrandLogo } from "@/components/storefront/BrandLogo";
import { Link, useLocation } from "@tanstack/react-router";
import { MapPin, Phone, Mail, ShieldCheck } from "lucide-react";

/** Five labels that all pointed at /categories now reach their own department. */
const categoryLinks = categories.slice(0, 5).map((c) => ({
  label: c.name,
  to: "/category/$slug" as const,
  params: { slug: c.slug },
}));

const groups = [
  { title: "Top categories", links: categoryLinks },
  {
    title: "Quick links",
    links: [
      { label: "All categories", to: "/categories" as const },
      { label: "Brands", to: "/brands" as const },
      { label: "Limited time offers", to: "/offers" as const },
      { label: "Loyalty points", to: "/points" as const },
      { label: "Sign in", to: "/auth" as const },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help centre", to: "/help" as const },
      // Both of these used to point at /help; the first now reaches the FAQ
      // answer it names, the second reaches the tracking page it names.
      { label: "Delivery & returns", to: "/help" as const, hash: "delivery-returns" },
      { label: "Track order", to: "/track" as const },
    ],
  },
];

export function SiteFooter() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <footer className="border-t border-border/80 bg-card/60 py-6 text-center text-xs text-muted-foreground backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-link" />
            <span className="font-bold text-foreground">{BRAND_NAME} Executive Control Panel</span>
          </div>
          <p>© {new Date().getFullYear()} Nills Mart. Authorized Internal Personnel Only.</p>
        </div>
      </footer>
    );
  }

  return (
    <>
      <TrustBand />
      <footer className="border-t border-border bg-surface pb-24 pt-10 md:pb-10">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <BrandLogo imgClassName="h-16 sm:h-20" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Authentic beauty and personal care, delivered across Bangladesh in a sealed,
              quality-checked box.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-link" />
                <span>{CONTACT.address}</span>
              </li>
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-link" />
                <a href={`tel:${CONTACT.phone}`} className="transition-colors hover:text-link">
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-link" />
                <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-link">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {g.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      {...("params" in l ? { params: l.params } : {})}
                      {...("hash" in l ? { hash: l.hash } : {})}
                      className="inline-block py-0.5 transition-colors hover:text-link"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-5xl px-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND_NAME}. Prices in BDT and include VAT. Delivery ৳79
          inside Dhaka, ৳119 outside Dhaka.
        </p>
      </footer>
    </>
  );
}
