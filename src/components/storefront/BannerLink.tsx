import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Anything that leaves the storefront. */
function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Wraps a banner in the right kind of link.
 *
 * Every banner went through a router `Link` with the destination cast to a route
 * that it might not be — which quietly suppressed the type error and, for an
 * off-site campaign URL, produced an anchor with no `rel`, handing the opened
 * page a `window.opener` reference back into the store. External targets now get
 * a plain anchor with `rel="noopener noreferrer"`; internal ones keep client-side
 * routing. The API refuses `javascript:` and `data:` targets on the way in.
 */
export function BannerLink({
  href,
  className,
  children,
}: {
  href?: string | null;
  className?: string;
  children: ReactNode;
}) {
  const target = href || "/offers";

  if (isExternal(target)) {
    return (
      <a href={target} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link to={target as "/offers"} className={className}>
      {children}
    </Link>
  );
}
