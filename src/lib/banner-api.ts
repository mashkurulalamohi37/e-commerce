import { apiFetch } from "@/lib/api-client";
import { toBanner, type ApiBanner, type Banner, type BannerPlacement } from "@/lib/banner-queries";

export type { Banner, BannerPlacement };

export type BannerInput = {
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
  startsAt: string | null;
  endsAt: string | null;
  sortOrder?: number;
};

function toApiPayload(input: BannerInput) {
  return {
    placement: input.placement,
    kicker: input.kicker || null,
    title: input.title,
    subtitle: input.subtitle || null,
    cta_label: input.ctaLabel || null,
    cta_href: input.ctaHref || "/offers",
    image_url: input.imageUrl,
    alt: input.alt,
    tone: input.tone,
    active: input.active,
    sort_order: input.sortOrder ?? 0,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
  };
}

export async function listAdminBanners(): Promise<Banner[]> {
  return (await apiFetch<ApiBanner[]>("/banners/admin/list")).map(toBanner);
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  return toBanner(
    await apiFetch<ApiBanner>("/banners/", {
      method: "POST",
      body: JSON.stringify(toApiPayload(input)),
    }),
  );
}

export async function updateBanner(id: string, input: BannerInput): Promise<Banner> {
  return toBanner(
    await apiFetch<ApiBanner>(`/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(toApiPayload(input)),
    }),
  );
}

export function deleteBanner(id: string): Promise<unknown> {
  return apiFetch(`/banners/${id}`, { method: "DELETE" });
}

export function reorderBanners(placement: BannerPlacement, ids: string[]): Promise<unknown> {
  return apiFetch("/banners/reorder", {
    method: "POST",
    body: JSON.stringify({ placement, ids }),
  });
}

/**
 * Uploads through the admin-only endpoint, which checks the extension, the
 * declared MIME type and the real magic bytes before writing anything.
 */
export async function uploadBannerImage(file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);
  // Let the browser set the multipart boundary — don't force a Content-Type.
  return apiFetch<{ url: string }>("/uploads/", { method: "POST", body });
}
