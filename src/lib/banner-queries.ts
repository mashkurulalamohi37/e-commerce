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

async function fetchPublicBanners(): Promise<Banner[]> {
  const rows = await apiFetch<ApiBanner[]>("/banners/", { anonymous: true });
  return rows.map(toBanner);
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
