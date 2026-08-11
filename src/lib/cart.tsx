import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "./product-queries";
import type { Product } from "./catalog";

type Line = { product: Product; qty: number };

type CartCtx = {
  lines: Line[];
  count: number;
  subtotal: number;
  open: boolean;
  loading: boolean;
  setOpen: (o: boolean) => void;
  /**
   * `silent` adds without opening the drawer — used by "Buy now", which
   * navigates straight to checkout and would otherwise arrive with the drawer
   * covering the page.
   */
  add: (p: Product, qty?: number, opts?: { silent?: boolean }) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

const STORAGE_KEY = "nillsmart_cart_v2";
/** Matches the per-line cap the API enforces on OrderItemCreate.qty. */
export const MAX_QTY_PER_LINE = 20;

/** Only slug and quantity are stored — prices and stock always come from the API. */
type StoredLine = { slug: string; qty: number };

function readStoredCart(): StoredLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const { slug, qty } = entry as { slug?: unknown; qty?: unknown };
      if (typeof slug !== "string" || typeof qty !== "number" || !Number.isFinite(qty)) return [];
      return [{ slug, qty: Math.min(Math.max(Math.floor(qty), 1), MAX_QTY_PER_LINE) }];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Starts empty. It previously seeded products[0], so every first-time visitor
  // arrived with an item already in their bag.
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [open, setOpen] = useState(false);

  // Hydrate after mount so server and client render the same empty cart.
  useEffect(() => {
    const initial = readStoredCart();
    if (initial.length) setStored(initial);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* private mode or quota — the cart just won't survive a reload */
    }
  }, [stored]);

  // Resolve stored slugs against live catalogue data, so the bag can never show
  // a price or stock level that disagrees with what checkout will charge.
  const { data: products, isLoading } = useQuery({
    ...productsQueryOptions(),
    enabled: stored.length > 0,
  });

  const value = useMemo<CartCtx>(() => {
    const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));

    const lines: Line[] = stored.flatMap(({ slug, qty }) => {
      const product = bySlug.get(slug);
      // A product that has been unpublished or deleted simply drops out of the bag.
      return product ? [{ product, qty }] : [];
    });

    const clamp = (qty: number) => Math.min(qty, MAX_QTY_PER_LINE);

    return {
      lines,
      open,
      setOpen,
      loading: stored.length > 0 && isLoading,
      add: (p, qty = 1, opts) => {
        setStored((prev) => {
          const found = prev.find((l) => l.slug === p.slug);
          if (found) {
            return prev.map((l) => (l.slug === p.slug ? { ...l, qty: clamp(l.qty + qty) } : l));
          }
          return [...prev, { slug: p.slug, qty: clamp(qty) }];
        });
        if (!opts?.silent) setOpen(true);
      },
      setQty: (slug, qty) =>
        setStored((prev) =>
          qty <= 0
            ? prev.filter((l) => l.slug !== slug)
            : prev.map((l) => (l.slug === slug ? { ...l, qty: clamp(qty) } : l)),
        ),
      remove: (slug) => setStored((prev) => prev.filter((l) => l.slug !== slug)),
      clear: () => setStored([]),
      count: lines.reduce((a, l) => a + l.qty, 0),
      subtotal: lines.reduce((a, l) => a + l.qty * l.product.price, 0),
    };
  }, [stored, products, isLoading, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
