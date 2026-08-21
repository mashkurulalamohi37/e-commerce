import { Link, useLocation } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { BRAND_NAME, CONTACT, categories } from "@/lib/catalog";
import { BrandLogo } from "@/components/storefront/BrandLogo";
import { BkashLogo, NagadLogo } from "@/components/storefront/PaymentLogos";

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
      <footer className="border-t border-emerald-950/40 bg-gradient-to-b from-[#082228] via-[#05181c] to-[#020b0e] text-white shadow-2xl">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {/* Column 1: Brand & Contact */}
            <div className="space-y-4">
              <Link to="/" className="group inline-block transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5">
                <div className="inline-flex items-center rounded-lg bg-white p-1.5 shadow-md ring-1 ring-white/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/20 group-hover:ring-emerald-400/50">
                  <BrandLogo imgClassName="h-11 sm:h-12 w-auto" />
                </div>
              </Link>
              <p className="text-sm leading-relaxed text-white/80 font-normal">
                Authentic dermatological & personal care products with direct importer authenticity guarantees across Bangladesh.
              </p>
              <div className="space-y-2.5 text-sm text-white/85 pt-1">
                <div>
                  <a
                    href={`tel:${CONTACT.phone}`}
                    className="group inline-flex items-center gap-2.5 font-bold text-white transition-colors duration-150 hover:text-emerald-300"
                  >
                    <Phone className="size-4 text-emerald-400 shrink-0" />
                    <span>{CONTACT.phone}</span>
                  </a>
                </div>
                <div>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="group inline-flex items-center gap-2.5 font-bold text-white transition-colors duration-150 hover:text-emerald-300"
                  >
                    <Mail className="size-4 text-emerald-400 shrink-0" />
                    <span>{CONTACT.email}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Categories */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-4">
                Categories
              </h3>
              <ul className="space-y-2.5 text-sm font-semibold">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      className="inline-block text-white/90 transition-colors duration-150 hover:text-emerald-300"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1.5">
                  <Link
                    to="/categories"
                    className="inline-block font-bold text-emerald-400 transition-colors duration-150 hover:text-white"
                  >
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
              <ul className="space-y-2.5 text-sm font-semibold">
                <li>
                  <Link
                    to="/track"
                    className="inline-flex items-center gap-2 font-bold text-white transition-colors duration-150 hover:text-emerald-300"
                  >
                    <Truck className="size-4 text-emerald-400 shrink-0" />
                    <span>Live Order Tracking</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/offers"
                    className="inline-block text-white/90 transition-colors duration-150 hover:text-emerald-300"
                  >
                    Special Offers & Deals 🔥
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help"
                    className="inline-block text-white/90 transition-colors duration-150 hover:text-emerald-300"
                  >
                    Help Center & FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="inline-block text-white/90 transition-colors duration-150 hover:text-emerald-300"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="inline-block text-white/90 transition-colors duration-150 hover:text-emerald-300"
                  >
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
                <div className="flex items-center gap-3">
                  <div
                    className="group flex h-9.5 min-w-[70px] cursor-pointer items-center justify-center rounded-xl bg-white px-3 py-1.5 shadow-md ring-1 ring-white/30 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-black/30 hover:ring-2 hover:ring-emerald-400/80 active:scale-95"
                    title="bKash"
                  >
                    <BkashLogo className="h-6 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div
                    className="group flex h-9.5 min-w-[70px] cursor-pointer items-center justify-center rounded-xl bg-white px-3 py-1.5 shadow-md ring-1 ring-white/30 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-black/30 hover:ring-2 hover:ring-emerald-400/80 active:scale-95"
                    title="Nagad"
                  >
                    <NagadLogo className="h-6.5 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Elevated Copyright Bar */}
          <div className="mt-10 border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/70 text-center sm:text-left font-medium">
            <p>© {new Date().getFullYear()} <strong className="text-white font-bold">{BRAND_NAME}</strong>. All rights reserved.</p>
            <span className="text-white/60">All prices in BDT (incl. VAT)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
