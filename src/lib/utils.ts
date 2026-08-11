import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve site-root paths (e.g. `/banners/offer-1.jpg`) against Vite `base`
 * so assets work when the app is hosted under a subdirectory like `/nills_mart/`.
 */
export function resolvePublicUrl(src: string) {
  if (!src) return src;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (!src.startsWith("/")) return src;

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}${src}`;
}
