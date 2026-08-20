const REAL_CONCERN_IMAGES: Record<string, string> = {
  acne: "/catalog/KERALISE--Crema-Comedolitica.png",
  dandruff: "/catalog/SEBOTIC--Anti-Dandruff-Shampoo.png",
  "dry skin": "/catalog/LIPIOL--Emulsione.png",
  "hair fall": "/catalog/SWISS-FORMULA--Hair-Serum.png",
  sun: "/catalog/PROTELION50--Emulsion.png",
  "oil control": "/catalog/KERALISE--Gel-Scrub.png",
};

import { Link } from "@tanstack/react-router";

import { concerns } from "@/lib/catalog";
import acne from "@/assets/concern-acne.jpg";
import antiAging from "@/assets/concern-anti-aging.jpg";
import dandruff from "@/assets/concern-dandruff.jpg";
import drySkin from "@/assets/concern-dry-skin.jpg";
import hairFall from "@/assets/concern-hair-fall.jpg";
import oilControl from "@/assets/concern-oil-control.jpg";
import pore from "@/assets/concern-pore.jpg";
import spot from "@/assets/concern-spot.jpg";
import hairThinning from "@/assets/concern-hair-thinning.jpg";
import sunBurn from "@/assets/concern-sun-burn.jpg";

/**
 * Artwork per concern. The concern list itself lives in catalog.ts so the home
 * page and /categories can't drift apart the way they had.
 */
const artwork: Record<string, string> = {
  acne,
  "anti aging": antiAging,
  dandruff,
  "dry skin": drySkin,
  "hair fall": hairFall,
  "oil control": oilControl,
  pigmentation: spot,
  pore,
  sun: sunBurn,
  "hair thinning": hairThinning,
};

export function ConcernTiles() {
  const concernTiles = concerns.map((c) => ({ ...c, image: artwork[c.query] ?? pore }));

  return (
    <section className="py-6">
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {concernTiles.map((c) => (
          <Link
            key={c.title}
            to="/search"
            search={{ q: c.query }}
            className="group block"
            aria-label={`${c.title} ${c.sub}`}
          >
            <div className="squircle-tile relative aspect-square bg-[linear-gradient(180deg,var(--concern-tile-top),var(--concern-tile-bottom))] p-3 transition-transform duration-200 group-hover:-translate-y-0.5">
              <div className="flex h-full flex-col items-center justify-between">
                <img
                  src={c.image}
                  alt={`${c.title} ${c.sub}`}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="hex-photo mt-1 h-[52%] w-[62%] object-cover drop-shadow-md"
                />
                <div className="pb-1 text-center leading-tight">
                  <p className="font-display text-sm font-extrabold uppercase text-white sm:text-base lg:text-lg">
                    {c.title}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/90 sm:text-xs">
                    {c.sub}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
