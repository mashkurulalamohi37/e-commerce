import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, LayoutGrid, ShoppingBag, LifeBuoy } from "lucide-react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/brands", label: "Brands", icon: Sparkles },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
] as const;

export function BottomNav() {
  const { count, setOpen } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The header and footer both swap to an admin variant on these routes; this
  // bar was pinning a storefront cart button over the admin console on mobile.
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] transition-colors",
                pathname === to ? "text-link" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          </li>
        ))}
        <li className="flex-1">
          <button
            onClick={() => setOpen(true)}
            aria-label={`Your cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="flex min-h-11 w-full flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
          >
            <span className="relative">
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -right-2.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </span>
            Bag
          </button>
        </li>
        <li className="flex-1">
          {/* Was a speech bubble labelled "Chat" that opened the FAQ. */}
          <Link
            to="/help"
            className={cn(
              "flex min-h-11 flex-col items-center gap-1 py-2 text-[11px] transition-colors",
              pathname === "/help" ? "text-link" : "text-muted-foreground",
            )}
          >
            <LifeBuoy className="size-5" />
            Help
          </Link>
        </li>
      </ul>
    </nav>
  );
}
