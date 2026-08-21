import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { Banner } from "@/lib/banner-queries";
import { BannerImage } from "./BannerImage";
import { BannerLink } from "./BannerLink";
import { cn } from "@/lib/utils";

/**
 * Full-bleed luxury hero carousel:
 * Immersive full-height product showcase with ambient luminous glow,
 * high-contrast typography, and smooth navigation controls.
 */
export function HeroCarousel({ slides }: { slides: Banner[] }) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [emblaRef, embla] = useEmblaCarousel(
    { loop: true, align: "start", containScroll: "trimSnaps", duration: 30 },
    [
      Autoplay({
        delay: 4500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    ],
  );
  const [selected, setSelected] = useState(0);
  const [playing] = useState(!prefersReducedMotion);

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
  }, [embla, onSelect]);

  useEffect(() => {
    const autoplay = embla?.plugins()?.autoplay;
    if (!autoplay) return;
    if (playing) autoplay.play();
    else autoplay.stop();
  }, [embla, playing]);

  if (!slides.length) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Featured offers" className="relative group/carousel">
      <div className="overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5 dark:ring-white/10" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, i) => {
            const isFullBanner = slide.imageUrl.includes("/banners/");
            return (
              <div
                key={slide.id}
                className="relative min-w-0 flex-[0_0_100%]"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
              >
                {isFullBanner ? (
                  /* Full-Bleed Panoramic Graphic Banner (Shajgoj / Sephora Style) */
                  <BannerLink
                    href={slide.ctaHref}
                    className="group relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1] lg:aspect-[2.7/1] overflow-hidden bg-muted">
                      <BannerImage
                        src={slide.imageUrl}
                        alt={slide.alt}
                        width={1920}
                        height={720}
                        priority={i === 0}
                        className="size-full"
                        imgClassName="size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    </div>
                  </BannerLink>
                ) : (
                  /* Split Layout Fallback */
                  <div className="relative block overflow-hidden">
                    <div
                      className={cn(
                        "relative min-h-[300px] sm:min-h-[360px] lg:min-h-[390px] w-full overflow-hidden p-5 sm:p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-8 lg:gap-12 transition-all duration-300",
                        slide.tone === "light"
                          ? "bg-gradient-to-br from-emerald-50/95 via-teal-50/80 to-slate-100 border border-emerald-600/15 text-slate-900"
                          : "bg-gradient-to-br from-[#0c2a30] via-[#092025] to-[#051317] border border-white/10 text-white",
                      )}
                    >
                      {/* Text Details Section */}
                      <div className="relative z-10 flex flex-1 flex-col justify-center items-center md:items-start text-center md:text-left gap-2.5 sm:gap-3.5 max-w-xl">
                        {slide.kicker ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-emerald-200 border border-white/15 backdrop-blur-sm">
                            {slide.kicker}
                          </span>
                        ) : null}

                        <BannerLink href={slide.ctaHref} className="transition-opacity hover:opacity-90">
                          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-tight hover:text-emerald-200 transition-colors">
                            {slide.title}
                          </h2>
                        </BannerLink>

                        {slide.subtitle ? (
                          <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed max-w-md font-medium line-clamp-2 sm:line-clamp-none">
                            {slide.subtitle}
                          </p>
                        ) : null}

                        {slide.ctaLabel ? (
                          <BannerLink
                            href={slide.ctaHref}
                            className="mt-1 sm:mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-extrabold text-primary-foreground shadow-md transition-all duration-300 hover:scale-105 hover:bg-primary/90"
                          >
                            <span>{slide.ctaLabel}</span>
                            <ChevronRight className="size-3.5 sm:size-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </BannerLink>
                        ) : null}
                      </div>

                      {/* Product Photo Showcase */}
                      <div className="relative z-10 flex h-52 sm:h-64 lg:h-76 w-full md:w-auto min-w-[200px] sm:min-w-[260px] lg:min-w-[340px] items-center justify-center">
                        <BannerLink
                          href={slide.ctaHref}
                          className="relative flex h-full aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white p-2.5 shadow-xl ring-1 ring-black/5 transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:rounded-3xl sm:p-3.5"
                        >
                          <BannerImage
                            src={slide.imageUrl}
                            alt={slide.alt}
                            width={800}
                            height={800}
                            priority={i === 0}
                            className="size-full bg-white flex items-center justify-center"
                            imgClassName="object-contain size-full max-h-full transition-transform duration-300"
                          />
                        </BannerLink>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Navigation Controls */}
      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => embla?.scrollPrev()}
            className="absolute top-1/2 left-2 sm:left-3.5 -translate-y-1/2 flex size-7 sm:size-8 items-center justify-center rounded-full bg-black/40 text-white border border-white/20 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary opacity-75 hover:opacity-100"
          >
            <ChevronLeft className="size-4 sm:size-4.5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => embla?.scrollNext()}
            className="absolute top-1/2 right-2 sm:right-3.5 -translate-y-1/2 flex size-7 sm:size-8 items-center justify-center rounded-full bg-black/40 text-white border border-white/20 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary opacity-75 hover:opacity-100"
          >
            <ChevronRight className="size-4 sm:size-4.5" />
          </button>

          {/* Dots Pagination Indicator */}
          <div className="absolute inset-x-0 bottom-3 sm:bottom-4 flex justify-center z-20">
            <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-md border border-white/10 shadow-md">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1} of ${slides.length}`}
                  aria-current={i === selected ? "true" : undefined}
                  onClick={() => embla?.scrollTo(i)}
                  className="grid size-4 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-300",
                      i === selected
                        ? "w-5 bg-primary shadow-xs shadow-primary/50"
                        : "w-1.5 bg-white/40 hover:bg-white/70",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

