/**
 * Lightweight client analytics with PostHog support.
 * Falls back to a no-op (dev console) when no project token is configured.
 */

const token = (import.meta.env.VITE_POSTHOG_API_KEY ||
  import.meta.env.VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY) as string | undefined;
const region =
  ((import.meta.env.VITE_POSTHOG_REGION ||
    import.meta.env.VITE_LOVABLE_CONNECTOR_POSTHOG_REGION) as string | undefined) || "eu";
const apiHost = region === "us" ? "https://us.i.posthog.com" : "https://eu.i.posthog.com";

const DISTINCT_KEY = "noorja_distinct_id";
const ATTR_KEY = "noorja_promo_attribution";

function distinctId() {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(DISTINCT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DISTINCT_KEY, id);
  }
  return id;
}

export type Props = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, properties: Props = {}) {
  if (typeof window === "undefined") return;
  const payload = {
    ...properties,
    $current_url: window.location.href,
    path: window.location.pathname,
  };
  if (!token) {
    if (import.meta.env.DEV) console.info("[analytics]", event, payload);
    return;
  }
  void fetch(`${apiHost}/i/v0/e/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      api_key: token,
      event,
      distinct_id: distinctId(),
      properties: payload,
    }),
  }).catch(() => {
    /* analytics must never break the UI */
  });
}

export type PromoAttribution = { slug: string; headline: string; at: number };

/** Remember which promo banner brought the user here, for conversion attribution. */
export function setPromoAttribution(slug: string, headline: string) {
  if (typeof window === "undefined") return;
  const value: PromoAttribution = { slug, headline, at: Date.now() };
  window.sessionStorage.setItem(ATTR_KEY, JSON.stringify(value));
}

export function getPromoAttribution(): PromoAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ATTR_KEY);
    return raw ? (JSON.parse(raw) as PromoAttribution) : null;
  } catch {
    return null;
  }
}

export function trackPromoBannerClick(slug: string, headline: string, position: number) {
  setPromoAttribution(slug, headline);
  track("promo_banner_click", { promo_slug: slug, promo_headline: headline, position });
}

export function trackPromoView(slug: string, headline: string, results: number) {
  track("promo_page_view", { promo_slug: slug, promo_headline: headline, results });
}

/** Conversion signal attributed to the promo banner that referred the session. */
export function trackPromoConversion(
  step: "add_to_cart" | "checkout_started" | "order_placed",
  properties: Props = {},
) {
  const attribution = getPromoAttribution();
  track("promo_conversion", {
    step,
    promo_slug: attribution?.slug ?? null,
    promo_headline: attribution?.headline ?? null,
    attributed: Boolean(attribution),
    ...properties,
  });
}
