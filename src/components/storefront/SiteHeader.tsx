import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  User,
  ShoppingBag,
  Store,
  Truck,
  ArrowRight,
} from "lucide-react";
import { BRAND_NAME, categories } from "@/lib/catalog";
import { BrandLogo } from "@/components/storefront/BrandLogo";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Category groups shown in the desktop mega-menu bar. */
const MENU = categories.slice(0, 7);

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith("/admin");

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate({ to: "/search", search: { q } });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/15 bg-background/95 shadow-xs backdrop-blur-md transition-colors">
      {/* Top utility bar */}
      <div className="mx-auto flex h-17 sm:h-18 lg:h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left Side: Mobile Menu Trigger + Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {!isAdminRoute && (
            <Sheet>
              <SheetTrigger
                aria-label="Open menu"
                className="-ml-1 rounded-lg p-2 text-foreground/80 transition-colors hover:bg-muted md:hidden"
              >
                <Menu className="size-5.5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-display tracking-wide">Browse</SheetTitle>
                </SheetHeader>
                <form role="search" onSubmit={runSearch} className="relative px-4 pb-2">
                  <label htmlFor="sheet-search" className="sr-only">
                    Search products, brands or concerns
                  </label>
                  <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="sheet-search"
                    type="search"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Search products or brands"
                    className="h-10 w-full rounded-full border border-primary/20 bg-background/90 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-all hover:border-primary/40 focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </form>
                <nav className="flex flex-col gap-3 px-4 pb-10">
                  <Link
                    to="/track"
                    className="flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/10 px-3.5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-primary/20"
                  >
                    <Truck className="size-4 text-primary" />
                    <span>Track Live Order</span>
                  </Link>
                  {categories.map((c) => (
                    <div key={c.slug}>
                      <Link
                        to="/category/$slug"
                        params={{ slug: c.slug }}
                        className="block rounded-md px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                      >
                        {c.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1.5 px-3">
                        {c.children.map((child) => (
                          <Link
                            key={child}
                            to="/category/$slug"
                            params={{ slug: c.slug }}
                            search={{ sub: child }}
                            className="rounded-full border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground"
                          >
                            {child}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}

          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLogo imgClassName="h-11 sm:h-12 md:h-13" />
          </Link>
          {isAdminRoute && (
            <span className="hidden items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-link sm:inline-flex">
              <ShieldCheck className="size-3.5" />
              Admin console
            </span>
          )}
        </div>

        {/* Center: Expansive Search Bar */}
        {!isAdminRoute && (
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form
              role="search"
              onSubmit={runSearch}
              className="relative w-full group"
            >
              <label htmlFor="site-search" className="sr-only">
                Search products, brands or concerns
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                id="site-search"
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search genuine skincare, haircare, brands..."
                className="h-11 w-full rounded-full border border-border/80 bg-muted/40 pl-11 pr-24 text-sm text-foreground shadow-xs transition-all placeholder:text-muted-foreground hover:border-primary/40 hover:bg-background focus:border-primary focus:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Right Side: Quick Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAdminRoute ? (
            <>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-accent hover:shadow-sm"
              >
                <Store className="size-4 text-link" />
                <span>View storefront</span>
              </Link>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold transition-colors hover:bg-muted">
                    <User className="size-4 text-link" />
                    <span className="hidden max-w-[8rem] truncate sm:inline">
                      {user.full_name?.split(" ")[0] || "Admin"}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="truncate text-xs font-semibold text-muted-foreground">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={signOut}>
                      <LogOut className="mr-2 size-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ) : (
            <>
              {/* Mobile Search Button */}
              <Link
                to="/search"
                aria-label="Search"
                className="grid size-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              >
                <Search className="size-5" />
              </Link>

              {/* Track Order Pill */}
              <Link
                to="/track"
                className="hidden items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs sm:text-sm font-bold text-foreground transition-all hover:border-primary hover:bg-primary/20 hover:scale-105 sm:inline-flex"
              >
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <Truck className="size-4 text-primary" />
                <span>Track Order</span>
              </Link>

              {/* User Account / Sign In */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3.5 py-2 text-foreground/90 transition-all hover:border-primary/40 hover:bg-background hover:text-foreground">
                    <User className="size-4.5 text-primary" />
                    <span className="hidden max-w-[10rem] truncate text-xs sm:text-sm font-bold sm:inline">
                      {user.full_name?.split(" ")[0] || user.email}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/orders">
                        <Package className="mr-2 size-4" />
                        Your orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/track">
                        <Truck className="mr-2 size-4 text-primary" />
                        Track an order
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <ShieldCheck className="mr-2 size-4" />
                          Admin dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={signOut}>
                      <LogOut className="mr-2 size-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  aria-label="Sign in"
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-4 py-2 text-foreground/90 transition-all hover:border-primary/40 hover:bg-background hover:text-foreground"
                >
                  <User className="size-4.5 text-primary" />
                  <span className="hidden text-xs sm:text-sm font-bold sm:inline">Sign in</span>
                </Link>
              )}

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setOpen(true)}
                aria-label={`Your cart, ${count} ${count === 1 ? "item" : "items"}`}
                className="relative grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-foreground transition-all hover:bg-primary/20 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ShoppingBag className="size-5 text-primary" />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-black tabular-nums text-primary-foreground shadow-md">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Desktop mega-menu bar — hidden on admin routes */}
      {!isAdminRoute && (
        <nav
          aria-label="Product categories"
          className="hidden border-t border-emerald-950/20 bg-gradient-to-r from-[#0c2a30] via-[#0f353c] to-[#0c2a30] text-white shadow-md md:block"
          onMouseLeave={() => setOpenGroup(null)}
        >
          <div className="mx-auto flex max-w-7xl items-stretch gap-1 px-4 sm:px-6 lg:px-8">
            {MENU.map((c) => (
              <div
                key={c.slug}
                className="relative"
                onMouseEnter={() => setOpenGroup(c.slug)}
              >
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  aria-expanded={openGroup === c.slug}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[12.5px] font-bold uppercase tracking-wider transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    openGroup === c.slug
                      ? "bg-white/20 text-white"
                      : "text-emerald-50/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {c.name}
                  <ChevronDown
                    className={`size-3.5 opacity-75 transition-transform duration-200 ${
                      openGroup === c.slug ? "rotate-180 text-white" : ""
                    }`}
                  />
                </Link>

                {openGroup === c.slug && (
                  <div className="absolute left-0 top-full z-50 w-64 rounded-b-xl border border-emerald-900/60 bg-[#0a2328] p-3 text-white shadow-2xl ring-1 ring-black/40">
                    <div className="border-b border-white/15 pb-2 px-2.5 mb-1.5">
                      <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                        {c.name}
                      </p>
                    </div>
                    <ul className="space-y-0.5">
                      {c.children.map((child) => (
                        <li key={child}>
                          <Link
                            to="/category/$slug"
                            params={{ slug: c.slug }}
                            search={{ sub: child }}
                            className="flex items-center rounded-lg px-2.5 py-2 text-xs font-semibold text-white/90 transition-colors duration-150 hover:bg-white/10 hover:text-emerald-300"
                          >
                            {child}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 border-t border-white/15 pt-1.5">
                      <Link
                        to="/category/$slug"
                        params={{ slug: c.slug }}
                        preload="intent"
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-bold text-emerald-400 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                      >
                        <span>View all {c.name}</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="ml-auto flex items-center gap-1">
              <Link
                to="/track"
                className="flex items-center gap-1.5 rounded px-3 py-2.5 text-[12px] font-bold uppercase tracking-wider text-emerald-100 transition-all hover:bg-white/10 hover:text-white"
              >
                <Truck className="size-3.5 text-emerald-400" />
                Track Order
              </Link>
              <Link
                to="/categories"
                className="rounded px-3 py-2.5 text-[12px] font-bold uppercase tracking-wider text-emerald-50/90 transition-all hover:bg-white/10 hover:text-white"
              >
                All categories
              </Link>
              <Link
                to="/brands"
                className="rounded px-3 py-2.5 text-[12px] font-bold uppercase tracking-wider text-emerald-50/90 transition-all hover:bg-white/10 hover:text-white"
              >
                Brands
              </Link>
              <Link
                to="/offers"
                className="my-1.5 ml-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                Offers 🔥
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
