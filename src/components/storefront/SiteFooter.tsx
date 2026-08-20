import { Link, useLocation } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { BRAND_NAME, CONTACT, categories } from "@/lib/catalog";
import { TrustBand } from "./TrustBand";
import { BrandLogo } from "@/components/storefront/BrandLogo";

export function SiteFooter() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <footer className="border-t border-border/80 bg-card/60 py-4 text-center text-xs text-muted-foreground backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldCheck className="size-3.5 text-link" />
            <span>{BRAND_NAME} Admin</span>
          </div>
          <p>© {new Date().getFullYear()} Nills Mart.</p>
        </div>
      </footer>
    );
  }

  return (
    <div className="print:hidden">
      <TrustBand />

      <footer className="border-t border-emerald-950/40 bg-gradient-to-b from-[#082228] via-[#05181c] to-[#020b0e] text-white shadow-2xl">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {/* Column 1: Brand & Contact */}
            <div className="space-y-4">
              <Link to="/" className="inline-block transition-transform duration-200 hover:scale-[1.02]">
                <div className="inline-flex items-center rounded bg-white p-1 shadow-sm">
                  <BrandLogo imgClassName="h-11 sm:h-12 w-auto" />
                </div>
              </Link>
              <p className="text-sm leading-relaxed text-white/80 font-normal">
                Authentic dermatological & personal care products with direct importer authenticity guarantees across Bangladesh.
              </p>
              <div className="space-y-2.5 text-sm text-white/85 pt-1">
                <p className="flex items-center gap-2.5">
                  <Phone className="size-4 text-emerald-400 shrink-0" />
                  <a href={`tel:${CONTACT.phone}`} className="font-bold text-white hover:text-emerald-300 transition-colors">
                    {CONTACT.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail className="size-4 text-emerald-400 shrink-0" />
                  <a href={`mailto:${CONTACT.email}`} className="font-bold text-white hover:text-emerald-300 transition-colors">
                    {CONTACT.email}
                  </a>
                </p>
              </div>
            </div>

            {/* Column 2: Categories */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-4">
                Categories
              </h3>
              <ul className="space-y-2.5 text-sm font-medium">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      className="text-white/75 hover:text-emerald-300 hover:underline transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1.5">
                  <Link to="/categories" className="font-bold text-emerald-300 hover:text-white hover:underline">
                    All Categories →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care & Tracking */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-4">
                Customer Care
              </h3>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link to="/track" className="flex items-center gap-2 font-bold text-white hover:text-emerald-300 transition-colors">
                    <Truck className="size-4 text-emerald-400" />
                    <span>Live Order Tracking</span>
                  </Link>
                </li>
                <li>
                  <Link to="/offers" className="text-white/75 hover:text-emerald-300 transition-colors">
                    Special Offers & Deals 🔥
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-white/75 hover:text-emerald-300 transition-colors">
                    Help Center & FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-white/75 hover:text-emerald-300 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-white/75 hover:text-emerald-300 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Location & Payment */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                Store Hub & Payment
              </h3>
              <p className="flex items-start gap-2.5 text-sm text-white/80 leading-relaxed">
                <MapPin className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{CONTACT.address}</span>
              </p>

              <div className="pt-1">
                <p className="text-xs uppercase font-extrabold tracking-wider text-emerald-200/80 mb-2.5">
                  We Accept:
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Cash on Delivery", "bKash", "Nagad", "Visa", "Mastercard"].map((m) => (
                    <span
                      key={m}
                      className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Elevated Copyright & Rates Bar */}
          <div className="mt-10 border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/70 text-center sm:text-left font-medium">
            <p>© {new Date().getFullYear()} <strong className="text-white font-bold">{BRAND_NAME}</strong>. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm">
              <span>Inside Dhaka: <strong className="text-white font-bold">৳79</strong></span>
              <span>•</span>
              <span>Outside Dhaka: <strong className="text-white font-bold">৳119</strong></span>
              <span>•</span>
              <span className="text-white/60">All prices in BDT (incl. VAT)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
