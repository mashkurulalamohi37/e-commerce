import { Link } from "@tanstack/react-router";
import type { Banner } from "@/lib/banner-queries";
import { BannerImage } from "./BannerImage";
import { cn } from "@/lib/utils";

/**
 * Wave-edged square offer tiles — the artwork is the message, so no text
 * overlay and no product content is drawn. Dynamically fills 1-4 columns.
 */
export function OfferTiles({ slides }: { slides: Banner[] }) {
  if (!slides.length) return null;

  const displaySlides = slides.slice(0, 4);
  const gridColsClass =
    displaySlides.length === 1
      ? "grid-cols-1"
      : displaySlides.length === 2
        ? "grid-cols-2"
        : displaySlides.length === 3
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={cn("grid gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-5", gridColsClass)}>
      {displaySlides.map((slide) => (
        <Link
          key={slide.id}
          to={(slide.ctaHref || "/offers") as "/offers"}
          className="wave-tile block transition-transform hover:-translate-y-0.5"
        >
          <BannerImage
            src={slide.imageUrl}
            alt={slide.alt || slide.title}
            width={800}
            height={800}
            className="aspect-square w-full"
          />
        </Link>
      ))}
    </div>
  );
}
