import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn, resolvePublicUrl } from "@/lib/utils";

/**
 * Banner image with a lightweight shimmer skeleton that stays visible until the
 * image decodes. Native lazy loading everywhere except the LCP slide, which
 * passes priority so it loads eagerly.
 */
export function BannerImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolvePublicUrl(src);

  // Banner URLs are admin-entered, so a dead one is reachable in normal use. It
  // used to render the browser's broken-image glyph in the hero slot.
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "relative grid place-items-center overflow-hidden bg-muted px-6 text-center",
          className,
        )}
      >
        <span className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageOff className="size-6" aria-hidden />
          <span className="max-w-[28ch] text-xs font-medium">{alt}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-transparent", className)}>
      {!loaded && (
        <div
          aria-hidden
          className="absolute inset-0 skeleton-shimmer"
        />
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setFailed(true);
        }}
        className={cn(
          "size-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </div>
  );
}
