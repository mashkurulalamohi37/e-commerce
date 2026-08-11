import { useState } from "react";
import { categories, brands, Brand } from "@/lib/catalog";
import { FolderTree, Tag, Layers, CheckCircle2 } from "lucide-react";

export function CategoriesAdminPanel() {
  const [activeTab, setActiveTab] = useState<"categories" | "brands">("categories");

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex rounded-xl bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "categories"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderTree className="size-3.5" /> Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("brands")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "brands"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="size-3.5" /> Brands ({brands.length})
          </button>
        </div>
      </div>

      {activeTab === "categories" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div
              key={c.slug}
              className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-card backdrop-blur-sm transition-all hover:shadow-lift"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-link" />
                  <h3 className="font-display text-base font-extrabold text-foreground">
                    {c.name}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                  <CheckCircle2 className="size-3" /> Active
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {c.children.length} subcategories included
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-border/60">
                {c.children.map((sub) => (
                  <span
                    key={sub}
                    className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {brands.map((b: Brand) => (
            <div
              key={b.slug}
              className="flex items-center justify-between rounded-xl border border-border/80 bg-card/90 p-3.5 shadow-sm transition-all hover:border-link hover:shadow-card"
            >
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-link shrink-0" />
                <span className="truncate text-xs font-bold text-foreground">{b.name}</span>
              </div>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {b.origin}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
