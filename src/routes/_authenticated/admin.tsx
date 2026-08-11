import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  BarChart3,
  Image as ImageIcon,
  Package,
  ShoppingBag,
  Activity,
  Ticket,
  MessageSquare,
  FolderTree,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { taka } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { BannersPanel } from "@/components/admin/BannersPanel";
import { ProductsAdminPanel } from "@/components/admin/ProductsAdminPanel";
import { OrdersAdminPanel } from "@/components/admin/OrdersAdminPanel";
import { PromotionsPanel } from "@/components/admin/PromotionsPanel";
import { ReviewsPanel } from "@/components/admin/ReviewsPanel";
import { CategoriesAdminPanel } from "@/components/admin/CategoriesAdminPanel";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  // Tab state used to live in component state, so a refresh dropped you back on
  // Analytics, Back left the console entirely, and no panel could be linked.
  validateSearch: (search: Record<string, unknown>): { panel?: AdminTab } => ({
    ...(isAdminTab(search.panel) ? { panel: search.panel } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Nills Mart Store Analytics" },
      {
        name: "description",
        content: "Sales analytics, inventory and order management for the Nills Mart store team.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AdminAnalytics = {
  range_days: number;
  totals: {
    revenue: number;
    paid_orders: number;
    total_orders: number;
    aov: number;
    payment_success_rate: number;
  };
  sales_by_day: { date: string; orders: number; revenue: number }[];
  top_products: { name: string; units: number; revenue: number }[];
  low_stock: { name: string; stock: number }[];
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Checking access…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user?.email} does not have the admin role. Ask an existing admin to grant access.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to store</Link>
        </Button>
      </div>
    );
  }

  return <AdminDashboard />;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/90 p-4.5 shadow-card backdrop-blur-sm transition-all duration-200 hover:shadow-lift">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-extrabold text-foreground tabular-nums sm:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p>}
    </div>
  );
}

const NAV_ITEMS = [
  {
    id: "analytics",
    label: "Analytics & sales",
    icon: BarChart3,
    description: "Revenue, paid orders and store metrics",
  },
  {
    id: "banners",
    label: "Promotional banners",
    icon: ImageIcon,
    description: "Home page carousel slides and offer tiles",
  },
  {
    id: "products",
    label: "Products & inventory",
    icon: Package,
    description: "Stock levels, pricing and catalogue entries",
  },
  {
    id: "orders",
    label: "Customer orders",
    icon: ShoppingBag,
    description: "Shipments, payment confirmation and order status",
  },
  {
    id: "promotions",
    label: "Promotions & coupons",
    icon: Ticket,
    description: "Promo codes and discount vouchers",
  },
  {
    id: "reviews",
    label: "Reviews & Q&A",
    icon: MessageSquare,
    description: "Moderate ratings and answer product questions",
  },
  {
    id: "categories",
    label: "Categories & brands",
    icon: FolderTree,
    description: "Department catalogue and brand directory",
  },
] as const;

type AdminTab = (typeof NAV_ITEMS)[number]["id"];

function isAdminTab(v: unknown): v is AdminTab {
  return typeof v === "string" && NAV_ITEMS.some((i) => i.id === v);
}

function AdminDashboard() {
  const { panel = "analytics" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeTab = panel;
  const setActiveTab = (id: AdminTab) => navigate({ search: { panel: id } });
  const activeItem = NAV_ITEMS.find((i) => i.id === activeTab);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col md:flex-row">
      {/* Left Admin Sidebar Panel */}
      <aside className="w-full shrink-0 border-b border-border/80 bg-card/60 p-4 backdrop-blur-md md:w-64 md:border-b-0 md:border-r md:p-6 lg:w-72">
        <div className="sticky top-24 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4 md:flex-col md:items-start md:gap-2">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-link">
                Control centre
              </p>
              <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">
                Admin console
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-surface px-3 py-1 text-xs font-bold text-success">
              <Activity className="size-3.5 animate-pulse" />
              Live store
            </span>
          </div>

          {/* On mobile this is a horizontal scroller with the scrollbar hidden;
              the fade tells you the remaining four items are there. */}
          <div className="relative md:contents">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent md:hidden"
            />
            <nav
              aria-label="Admin panels"
              className="flex flex-row gap-1.5 overflow-x-auto no-scrollbar md:flex-col"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex min-h-11 cursor-pointer items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold outline-none select-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lift md:translate-x-1"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-link hover:shadow-sm md:hover:translate-x-1",
                    )}
                  >
                    <Icon className="size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-1 border-b border-border/60 pb-4">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {activeItem?.label}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">{activeItem?.description}</p>
        </div>

        {activeTab === "analytics" && <AnalyticsPanel />}
        {activeTab === "banners" && <BannersPanel />}
        {activeTab === "products" && <ProductsAdminPanel />}
        {activeTab === "orders" && <OrdersAdminPanel />}
        {activeTab === "promotions" && <PromotionsPanel />}
        {activeTab === "reviews" && <ReviewsPanel />}
        {activeTab === "categories" && <CategoriesAdminPanel />}
      </main>
    </div>
  );
}

function AnalyticsPanel() {
  const analytics = useQuery<AdminAnalytics>({
    queryKey: ["admin", "analytics", 30],
    queryFn: () => apiFetch("/analytics/?days=30"),
  });

  if (analytics.isLoading) {
    return <p className="py-8 text-sm text-muted-foreground">Loading analytics…</p>;
  }
  if (analytics.isError) {
    return (
      <p role="alert" className="py-8 text-sm text-destructive">
        Could not load analytics: {(analytics.error as Error).message}
      </p>
    );
  }

  const a = analytics.data!;
  const hasSales = a.sales_by_day.some((d) => d.revenue > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Revenue"
          value={taka(a.totals.revenue)}
          hint={`${a.totals.paid_orders} paid orders`}
        />
        <Stat label="Avg order value" value={taka(a.totals.aov)} />
        <Stat label="Orders" value={String(a.totals.total_orders)} hint="all payment methods" />
        <Stat
          label="Payment success"
          value={pct(a.totals.payment_success_rate)}
          hint="online payments only"
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h2 className="section-title">Sales by day</h2>
        {hasSales ? (
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.sales_by_day}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={11} />
                <YAxis fontSize={11} width={52} />
                <Tooltip formatter={(v: number) => taka(Number(v))} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No paid orders in this period yet.
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="section-title">Top products</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {a.top_products.length === 0 && (
              <li className="text-muted-foreground">No paid orders yet.</li>
            )}
            {a.top_products.map((p) => (
              <li key={p.name} className="flex justify-between gap-3">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {p.units} · {taka(p.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="section-title">Lowest stock</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {a.low_stock.length === 0 && (
              <li className="text-muted-foreground">No products yet.</li>
            )}
            {a.low_stock.map((p) => (
              <li key={p.name} className="flex justify-between gap-3">
                <span className="truncate">{p.name}</span>
                <span
                  className={
                    p.stock <= 5 ? "shrink-0 font-semibold text-sale" : "shrink-0 font-semibold"
                  }
                >
                  {p.stock}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
