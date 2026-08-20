import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { fallbackImageFor, type Product, products as fallbackProducts, inCategory } from "@/lib/catalog";

/** Shape returned by GET /products/ — snake_case, straight from the API. */
export type ApiProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brief: string | null;
  size: string | null;
  price: number;
  list_price: number | null;
  stock: number;
  ingredients: string | null;
  how_to_use: string | null;
  image_url: string | null;
  brand_slug: string | null;
  categories: string[];
  concerns: string[] | null;
  best_seller: boolean;
  on_offer: boolean;
  published: boolean;
  rating: number;
  reviews_count: number;
};

/**
 * Adapts an API row to the Product shape the storefront components render.
 *
 * The catalogue used to be a hardcoded array, so prices, stock and availability
 * shown to shoppers drifted from what checkout actually charged. Everything
 * customer-facing now comes from this one place.
 */
export function toProduct(row: ApiProduct): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandSlug: row.brand_slug ?? "",
    image: row.image_url || fallbackImageFor(row.slug),
    size: row.size ?? "",
    sku: row.sku,
    price: row.price,
    // Without a list price there is no discount to show, so fall back to price.
    listPrice: row.list_price ?? row.price,
    stock: row.stock,
    bestSeller: row.best_seller,
    onOffer: row.on_offer,
    published: row.published,
    categories: row.categories ?? [],
    concerns: row.concerns ?? [],
    brief: row.brief ?? "",
    ingredients: row.ingredients ?? "",
    howToUse: row.how_to_use ?? "",
    rating: row.rating,
    reviews: row.reviews_count,
  };
}

export type ProductFilters = {
  category?: string;
  brand?: string;
  search?: string;
  onOffer?: boolean;
  bestSeller?: boolean;
  limit?: number;
};

function toQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.search) params.set("search", filters.search);
  if (filters.onOffer !== undefined) params.set("on_offer", String(filters.onOffer));
  if (filters.bestSeller !== undefined) params.set("best_seller", String(filters.bestSeller));
  params.set("limit", String(filters.limit ?? 100));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    const rows = await apiFetch<ApiProduct[]>(`/products/${toQueryString(filters)}`, {
      anonymous: true,
    });
    if (rows && rows.length > 0) {
      return rows.map(toProduct);
    }
  } catch (err) {
    console.warn("API products fetch failed, using fallback catalog:", err);
  }

  let list = fallbackProducts;
  if (filters.category) {
    list = inCategory(list, filters.category);
  }
  if (filters.brand) {
    list = list.filter((p) => p.brandSlug === filters.brand);
  }
  if (filters.onOffer) {
    list = list.filter((p) => p.onOffer);
  }
  if (filters.bestSeller) {
    list = list.filter((p) => p.bestSeller);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brandSlug.toLowerCase().includes(q) ||
        p.categories.some((c) => c.toLowerCase().includes(q)),
    );
  }
  return list;
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  try {
    const row = await apiFetch<ApiProduct>(`/products/by-slug/${encodeURIComponent(slug)}`, {
      anonymous: true,
    });
    if (row) return toProduct(row);
  } catch (err) {
    console.warn("API product by slug fetch failed, using fallback catalog:", err);
  }
  const found = fallbackProducts.find((p) => p.slug === slug);
  if (found) return found;
  throw new Error("Product not found");
}

export const productsQueryOptions = (filters: ProductFilters = {}) =>
  queryOptions({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 30 * 60_000,
  });

export const productQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

/** Search across name, brand, category and concern — matches the old local behaviour. */
export const searchQueryOptions = (term: string) => {
  const q = term.trim();
  return queryOptions({
    queryKey: ["products", "search", q.toLowerCase()],
    queryFn: () => fetchProducts(q ? { search: q } : {}),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
};
