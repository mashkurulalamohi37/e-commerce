import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import type { Banner } from "@/lib/banner-queries";
import { BannerImage } from "./BannerImage";
import { cn } from "@/lib/utils";

/**
 * Offer banner rail: free-scroll swipe on mobile, 2 up on tablet, 3 up on
 * desktop. Images lazy load with a skeleton placeholder.
 */
export function OfferCarousel({ slides }: { slides: Banner[] }) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  if (!slides.length) return null;

  return (
    <div
      className="overflow-hidden"
      ref={emblaRef}
      aria-roledescription="carousel"
      aria-label="Promotional offers"
    >
      <div className="flex touch-pan-y gap-3">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            className="min-w-0 flex-[0_0_82%] sm:flex-[0_0_48%] lg:flex-[0_0_32%]"
          >
            <Link
              to={(slide.ctaHref || "/offers") as "/offers"}
              className="relative block overflow-hidden rounded-xl"
            >
              <BannerImage
                src={slide.imageUrl}
                alt={slide.alt}
                width={1200}
                height={800}
                className="aspect-[3/2] w-full"
              />
              <div
                className={cn(
                  "absolute inset-0 flex flex-col justify-end gap-0.5 p-3",
                  slide.tone === "light"
                    ? "bg-gradient-to-t from-background/90 via-background/35 to-transparent text-foreground"
                    : "bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent text-background",
                )}
              >
                {slide.kicker ? (
                  <span className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-90">
                    {slide.kicker}
                  </span>
                ) : null}
                <span className="display-caps text-sm leading-tight">{slide.title}</span>
                {slide.subtitle ? (
                  <span className="text-[11px] opacity-90">{slide.subtitle}</span>
                ) : null}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
