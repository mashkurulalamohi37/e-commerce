import { Link } from "@tanstack/react-router";
import { promos } from "@/lib/promos";
import { trackPromoBannerClick } from "@/lib/analytics";

export function BrandOfferGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4 sm:px-5 lg:grid-cols-3 lg:gap-5 lg:px-6">
      {promos.map((t, i) => (
        <Link
          key={t.slug}
          to="/promo/$slug"
          params={{ slug: t.slug }}
          onClick={() => trackPromoBannerClick(t.slug, t.headline, i + 1)}
          aria-label={`${t.headline} — ${t.sub}`}
          className="group relative block overflow-hidden rounded-xl shadow-card outline-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <img
            src={t.image}
            alt={t.alt}
            loading="lazy"
            decoding="async"
            width={1152}
            height={512}
            className="h-[120px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.05] sm:h-[132px] lg:h-[150px]"
          />
          <div
            aria-hidden
            className={
              t.tone === "dark"
                ? "absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.62)_48%,transparent_74%)]"
                : "absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.42)_48%,transparent_74%)]"
            }
          />
          <div className="absolute inset-y-0 left-0 flex w-[64%] flex-col justify-center gap-1 p-3.5 sm:p-4 lg:p-5">
            {/* These sit on a scrim over artwork, not on the page ground, so
                the colours are fixed rather than themed — `text-foreground`
                flipped to near-white in dark mode on top of the white scrim. */}
            <p
              className={`font-display text-[15px] font-extrabold leading-[1.15] line-clamp-2 sm:text-base lg:text-lg ${
                t.tone === "dark" ? "text-neutral-900" : "text-white"
              }`}
            >
              {t.headline}
            </p>
            <p
              className={`truncate text-[10.5px] font-semibold uppercase tracking-wide sm:text-[11px] lg:text-xs ${
                t.tone === "dark" ? "text-neutral-700" : "text-white/85"
              }`}
            >
              {t.sub}
            </p>
            {/* Was opacity-0 until hover, so touch users — most of this
                audience — never saw a call to action at all. */}
            <span
              className={`mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-opacity duration-300 md:opacity-80 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 ${
                t.tone === "dark" ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
              }`}
            >
              Shop now
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
