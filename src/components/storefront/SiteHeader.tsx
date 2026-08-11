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
} from "lucide-react";
import { BRAND_NAME, categories } from "@/lib/catalog";
import { BrandLogo } from "@/components/storefront/BrandLogo";
import { ThemeToggle } from "@/components/storefront/ThemeToggle";
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
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate({ to: "/search", search: { q } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 md:h-20">
        {!isAdminRoute && (
          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className="-ml-1 rounded-md p-2 text-foreground/80 transition-colors hover:bg-muted md:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-display tracking-wide">Browse</SheetTitle>
              </SheetHeader>
              {/* The sheet listed every category but had no way to search. */}
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
                  className="h-11 w-full rounded-full border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </form>
              <nav className="flex flex-col gap-3 px-4 pb-10">
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

        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center py-1" aria-label={`${BRAND_NAME} home`}>
            <BrandLogo imgClassName="h-12 sm:h-14 md:h-16 lg:h-18" />
          </Link>
          {isAdminRoute && (
            <span className="hidden items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-link sm:inline-flex">
              <ShieldCheck className="size-3.5" />
              Admin Console
            </span>
          )}
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {isAdminRoute ? (
            <>
              <ThemeToggle />
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-accent hover:shadow-sm"
              >
                <Store className="size-4 text-link" />
                <span>View Storefront</span>
              </Link>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold transition-colors hover:bg-muted">
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
              {/* Search used to be an icon that navigated to a separate page
                  before you could type a character. */}
              <form
                role="search"
                onSubmit={runSearch}
                className="relative mr-1 hidden min-w-0 flex-1 sm:block sm:max-w-xs lg:max-w-sm"
              >
                <label htmlFor="site-search" className="sr-only">
                  Search products, brands or concerns
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="site-search"
                  type="search"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search products or brands"
                  className="h-10 w-full rounded-full border border-input bg-card/80 pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
              </form>
              <Link
                to="/search"
                aria-label="Search"
                className="grid size-11 place-items-center rounded-md text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
              >
                <Search className="size-5" />
              </Link>
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground">
                    <User className="size-5" />
                    <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:inline">
                      {user.full_name?.split(" ")[0] || user.email}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Was "Track an order", which sent a signed-in customer to
                        a form asking for the order number and phone we already
                        have on file. */}
                    <DropdownMenuItem asChild>
                      <Link to="/orders">
                        <Package className="mr-2 size-4" />
                        Your orders
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
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <User className="size-5" />
                  <span className="hidden text-sm font-semibold sm:inline">Sign in</span>
                </Link>
              )}

              <button
                onClick={() => setOpen(true)}
                aria-label={`Your bag, ${count} ${count === 1 ? "item" : "items"}`}
                className="relative grid size-11 shrink-0 place-items-center rounded-md text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ShoppingBag className="size-5" />
                {count > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground">
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
          className="hidden border-t border-border/60 bg-surface md:block"
          onMouseLeave={() => setOpenGroup(null)}
        >
          <div className="mx-auto flex max-w-6xl items-stretch gap-1 px-4">
            {MENU.map((c) => (
              <div key={c.slug} className="relative" onMouseEnter={() => setOpenGroup(c.slug)}>
                {/* Points at the department's own product grid. This used to go
                    to /categories#slug — a page of text chips — while the home
                    page tiles went to /category/$slug, so the same name led to
                    two different places. */}
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  aria-expanded={openGroup === c.slug}
                  className="flex items-center gap-1 px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {c.name}
                  <ChevronDown className="size-3.5 opacity-60" />
                </Link>

                {openGroup === c.slug && (
                  <div className="absolute left-0 top-full z-50 w-64 rounded-b-xl border border-border border-t-0 bg-background p-4 shadow-card">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-link">
                      {c.name}
                    </p>
                    <ul className="space-y-1.5">
                      {c.children.map((child) => (
                        <li key={child}>
                          <Link
                            to="/category/$slug"
                            params={{ slug: c.slug }}
                            search={{ sub: child }}
                            className="block text-sm text-foreground/80 transition-colors hover:text-link"
                          >
                            {child}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      className="mt-3 inline-block text-xs font-semibold text-link"
                    >
                      View all {c.name}
                    </Link>
                  </div>
                )}
              </div>
            ))}

            <div className="ml-auto flex items-center gap-1">
              {/* Jewellery, Accessories and Daily Needs fall outside the seven
                  slots above and had no route into them from this bar. */}
              <Link
                to="/categories"
                className="px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-foreground/80 hover:text-link"
              >
                All categories
              </Link>
              <Link
                to="/brands"
                className="px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-foreground/80 hover:text-link"
              >
                Brands
              </Link>
              <Link
                to="/offers"
                className="my-1.5 rounded-full bg-primary px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-primary-foreground"
              >
                Offers
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
