import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchProducts } from "@/lib/product-queries";
import { categories } from "@/lib/catalog";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

/**
 * Absolute origin for <loc>. The sitemap spec requires fully-qualified URLs;
 * emitting "/offers" made the whole file invalid. Falls back to the requesting
 * origin so a deployment without VITE_SITE_URL still produces a usable file.
 */
function resolveOrigin(request: Request): string {
  const configured = process.env.VITE_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

const escapeXml = (value: string) =>
  value.replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = resolveOrigin(request);

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/categories", changefreq: "weekly", priority: "0.8" },
          { path: "/brands", changefreq: "weekly", priority: "0.8" },
          { path: "/offers", changefreq: "daily", priority: "0.9" },
          { path: "/search", changefreq: "weekly", priority: "0.4" },
          { path: "/help", changefreq: "monthly", priority: "0.5" },
          { path: "/points", changefreq: "monthly", priority: "0.5" },
          // /login is deliberately absent: it 307-redirects to /auth, and
          // listing a redirect in a sitemap is a crawl error.
          { path: "/auth", changefreq: "yearly", priority: "0.3" },
          ...categories.map((c) => ({
            path: `/category/${c.slug}`,
            changefreq: "weekly" as const,
            priority: "0.6",
          })),
        ];

        // Published products only, straight from the API — a hardcoded list went
        // stale the moment anything was added or unpublished.
        try {
          const products = await fetchProducts({ limit: 500 });
          entries.push(
            ...products.map((p) => ({
              path: `/product/${p.slug}`,
              changefreq: "weekly" as const,
              priority: "0.7",
            })),
          );
        } catch {
          // A catalogue outage shouldn't take the sitemap down with it.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${escapeXml(`${origin}${e.path}`)}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
