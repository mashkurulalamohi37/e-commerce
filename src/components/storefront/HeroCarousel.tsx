import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Banner } from "@/lib/banner-queries";
import { BannerImage } from "./BannerImage";
import { cn } from "@/lib/utils";

/**
 * Full-bleed hero carousel: swipeable on touch, arrow buttons from md up,
 * dots on every breakpoint, one slide per view at all sizes.
 */
export function HeroCarousel({ slides }: { slides: Banner[] }) {
  // Respect the OS setting before the carousel ever starts moving.
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [emblaRef, embla] = useEmblaCarousel(
    { loop: true, align: "start", containScroll: "trimSnaps" },
    [
      // stopOnInteraction was false, so the carousel kept advancing even after the
      // user clicked an arrow or a dot — content moved out from under them.
      Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
    ],
  );
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(!prefersReducedMotion);

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
  }, [embla, onSelect]);

  // WCAG 2.2.2: anything moving automatically for more than five seconds needs
  // a way to stop it. There was no pause control at all.
  useEffect(() => {
    const autoplay = embla?.plugins()?.autoplay;
    if (!autoplay) return;
    if (playing) autoplay.play();
    else autoplay.stop();
  }, [embla, playing]);

  if (!slides.length) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Featured offers" className="relative">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="relative min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              <Link to={(slide.ctaHref || "/offers") as "/offers"} className="block">
                <BannerImage
                  src={slide.imageUrl}
                  alt={slide.alt}
                  width={1600}
                  height={900}
                  priority={i === 0}
                  className="aspect-[16/10] w-full sm:aspect-[2/1] lg:aspect-[12/5]"
                />
                <div
                  className={cn(
                    "absolute inset-0 flex flex-col justify-end gap-1 p-4 sm:p-6 lg:p-10",
                    slide.tone === "light"
                      ? "bg-gradient-to-t from-background/85 via-background/40 to-transparent text-foreground"
                      : "bg-gradient-to-t from-foreground/80 via-foreground/35 to-transparent text-background",
                  )}
                >
                  {slide.kicker ? (
                    <span className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-90">
                      {slide.kicker}
                    </span>
                  ) : null}
                  <h2 className="display-caps max-w-[22ch] text-xl leading-tight sm:text-2xl lg:text-4xl">
                    {slide.title}
                  </h2>
                  {slide.subtitle ? (
                    <p className="max-w-[38ch] text-xs opacity-90 sm:text-sm">{slide.subtitle}</p>
                  ) : null}
                  {slide.ctaLabel ? (
                    <span className="mt-2 inline-flex w-fit rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                      {slide.ctaLabel}
                    </span>
                  ) : null}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => embla?.scrollPrev()}
            className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:grid"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => embla?.scrollNext()}
            className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:grid"
          >
            <ChevronRight className="size-4" />
          </button>
          {/* Dots were 6px near-white pips painted straight onto admin-supplied
              artwork — invisible on light banners and far under the minimum
              touch target. They now sit on a dark pill with a 24px hit area. */}
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <div className="flex items-center gap-0.5 rounded-full bg-foreground/55 px-1.5 py-0.5 backdrop-blur-sm">
              <button
                type="button"
                aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                onClick={() => setPlaying((p) => !p)}
                className="grid size-6 place-items-center rounded-full text-background transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
              >
                {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
              </button>
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1} of ${slides.length}`}
                  aria-current={i === selected ? "true" : undefined}
                  onClick={() => embla?.scrollTo(i)}
                  className="grid size-6 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full bg-background/60 transition-all",
                      i === selected ? "w-5 bg-background" : "w-1.5",
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
