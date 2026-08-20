import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export type BannerPlacement = "hero" | "offer";

export type Banner = {
  id: string;
  placement: BannerPlacement;
  kicker: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  alt: string;
  tone: "dark" | "light";
  active: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

export type ApiBanner = {
  id: string;
  placement: string;
  kicker: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string;
  alt: string | null;
  tone: string;
  active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

export function toBanner(row: ApiBanner): Banner {
  return {
    id: row.id,
    placement: row.placement === "offer" ? "offer" : "hero",
    kicker: row.kicker ?? "",
    title: row.title,
    subtitle: row.subtitle ?? "",
    ctaLabel: row.cta_label ?? "",
    ctaHref: row.cta_href ?? "/offers",
    imageUrl: row.image_url,
    // Alt text is required for accessibility; fall back to the title rather
    // than shipping an image with an empty alt attribute.
    alt: row.alt?.trim() || row.title,
    tone: row.tone === "light" ? "light" : "dark",
    active: row.active,
    sortOrder: row.sort_order,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export const FALLBACK_BANNERS: Banner[] = [
  {
    id: "hero-1",
    placement: "hero",
    kicker: "Italian Dermatological Care",
    title: "Galenia & Sebotic",
    subtitle: "Physiological & Anti-Dandruff Scalp Solutions",
    ctaLabel: "Shop Now",
    ctaHref: "/category/hair-care",
    imageUrl: "/banners/hero-sebotic-galenia.jpg",
    alt: "Galenia and Sebotic Scalp Care",
    tone: "dark",
    active: true,
    sortOrder: 1,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "hero-2",
    placement: "hero",
    kicker: "Dry & Sensitive Skin Solutions",
    title: "Lipiol Derm Care",
    subtitle: "Intense Hydration & Barrier Repair",
    ctaLabel: "Explore Range",
    ctaHref: "/category/skin-care",
    imageUrl: "/banners/hero-lipiol-collection.jpg",
    alt: "Lipiol Skincare Range",
    tone: "light",
    active: true,
    sortOrder: 2,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "hero-3",
    placement: "hero",
    kicker: "Advanced Radiance & Hydration",
    title: "Swiss Formula",
    subtitle: "Hyaluronic Acid & Active Face/Hair Serums",
    ctaLabel: "Discover Now",
    ctaHref: "/category/skin-care",
    imageUrl: "/banners/hero-swiss-formula.jpg",
    alt: "Swiss Formula Serums",
    tone: "dark",
    active: true,
    sortOrder: 3,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "hero-4",
    placement: "hero",
    kicker: "Maximum UV Defense · SPF 50+",
    title: "Protelion 50",
    subtitle: "Elevated UVB + UVA Solar Protection",
    ctaLabel: "Shop Suncare",
    ctaHref: "/category/skin-care",
    imageUrl: "/banners/hero-protelion-sunscreen.jpg",
    alt: "Protelion 50 Sun Protection",
    tone: "dark",
    active: true,
    sortOrder: 4,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "offer-1",
    placement: "offer",
    kicker: "Special Offer",
    title: "Sebotic Anti-Dandruff Duo",
    subtitle: "Complete scalp care pack with physiological shampoo",
    ctaLabel: "View Deal",
    ctaHref: "/offers",
    imageUrl: "/banners/offer-1.jpg",
    alt: "Sebotic Anti-Dandruff Duo",
    tone: "dark",
    active: true,
    sortOrder: 1,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "offer-2",
    placement: "offer",
    kicker: "Limited Deal",
    title: "Lipiol Hydration Trio",
    subtitle: "Intensive cleansing cream and barrier repair face emulsion",
    ctaLabel: "Shop Pack",
    ctaHref: "/offers",
    imageUrl: "/banners/offer-2.jpg",
    alt: "Lipiol Hydration Trio",
    tone: "light",
    active: true,
    sortOrder: 2,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "offer-3",
    placement: "offer",
    kicker: "Exclusive",
    title: "Swiss Formula Serum Glow Set",
    subtitle: "Vitamin C face serum with pure hair nourishment oil",
    ctaLabel: "Grab Offer",
    ctaHref: "/offers",
    imageUrl: "/banners/offer-3.jpg",
    alt: "Swiss Formula Serum Glow Set",
    tone: "dark",
    active: true,
    sortOrder: 3,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "offer-4",
    placement: "offer",
    kicker: "Sun Care",
    title: "Protelion 50 & Keralise Duo",
    subtitle: "Complete acne-safe facial scrub with high SPF protection",
    ctaLabel: "Buy Now",
    ctaHref: "/offers",
    imageUrl: "/banners/offer-4.jpg",
    alt: "Protelion 50 & Keralise Duo",
    tone: "dark",
    active: true,
    sortOrder: 4,
    startsAt: null,
    endsAt: null,
  },
];

async function fetchPublicBanners(): Promise<Banner[]> {
  try {
    const rows = await apiFetch<ApiBanner[]>("/banners/", { anonymous: true });
    if (rows && rows.length > 0) {
      return rows.map(toBanner);
    }
  } catch (err) {
    console.warn("API banners fetch failed, using fallback banners:", err);
  }
  return FALLBACK_BANNERS;
}

export const bannersQueryOptions = queryOptions({
  queryKey: ["banners"],
  queryFn: fetchPublicBanners,
  staleTime: 60_000,
});

export const adminBannersQueryOptions = queryOptions({
  queryKey: ["admin", "banners"],
  queryFn: async () => (await apiFetch<ApiBanner[]>("/banners/admin/list")).map(toBanner),
});

export const byPlacement = (banners: Banner[] | undefined, placement: BannerPlacement) =>
  (banners ?? []).filter((b) => b.placement === placement);
