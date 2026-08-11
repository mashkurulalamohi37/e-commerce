import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Package, Check, X, AlertTriangle, Download } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { brands, categories, taka } from "@/lib/catalog";
import { exportToCSV } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, RequiredLegend } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { PAGE_SIZE, TablePager } from "@/components/admin/TablePager";

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brief?: string;
  price: number;
  list_price?: number;
  stock: number;
  brand_slug?: string;
  categories: string[];
  best_seller: boolean;
  on_offer: boolean;
  published: boolean;
  rating: number;
  reviews_count: number;
  image_url?: string;
}

export function ProductsAdminPanel() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [brief, setBrief] = useState("");
  const [brandSlug, setBrandSlug] = useState("cetaphil");
  const [category, setCategory] = useState("skin-care");
  const [imageUrl, setImageUrl] = useState("");
  const [bestSeller, setBestSeller] = useState(false);
  const [onOffer, setOnOffer] = useState(false);

  // The admin listing, not the public one: /products/ filters on published, so
  // unpublishing a product used to make it vanish with no way to bring it back.
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery<ProductItem[]>({
    queryKey: ["admin", "products"],
    queryFn: () => apiFetch("/products/admin/list"),
  });

  const createMutation = useMutation({
    mutationFn: (newProd: any) =>
      apiFetch("/products/", { method: "POST", body: JSON.stringify(newProd) }),
    onSuccess: () => {
      toast.success("Product created successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      // The storefront reads its own product queries — refresh those too.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
      setIsOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      // The storefront reads its own product queries — refresh those too.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
      setIsOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete product"),
  });

  function resetForm() {
    setName("");
    setSku("");
    setSlug("");
    setPrice("");
    setStock("");
    setBrief("");
    setBrandSlug("cetaphil");
    setCategory("skin-care");
    setImageUrl("");
    setBestSeller(false);
    setOnOffer(false);
    setEditingProduct(null);
  }

  function handleEdit(p: ProductItem) {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setSlug(p.slug);
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setBrief(p.brief || "");
    setBrandSlug(p.brand_slug || "cetaphil");
    setCategory(p.categories?.[0] || "skin-care");
    setImageUrl(p.image_url || "");
    setBestSeller(p.best_seller);
    setOnOffer(p.on_offer);
    setIsOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      sku,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      brief,
      brand_slug: brandSlug,
      categories: [category],
      image_url: imageUrl,
      best_seller: bestSeller,
      on_offer: onOffer,
      published: true,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const handleExportCSV = () => {
    if (!products.length) {
      toast.error("No products to export");
      return;
    }
    const exportData = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      "Price (BDT)": p.price,
      "Stock Level": p.stock,
      Brand: p.brand_slug || "",
      "Best Seller": p.best_seller ? "Yes" : "No",
      "On Offer": p.on_offer ? "Yes" : "No",
    }));
    exportToCSV("nills_mart_inventory", exportData);
    toast.success("Inventory exported to CSV!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="compact"
          onClick={handleExportCSV}
          className="gap-1.5 font-bold"
        >
          <Download className="size-3.5 text-link" /> Export CSV
        </Button>
        <Dialog
          open={isOpen}
          onOpenChange={(val) => {
            setIsOpen(val);
            if (!val) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="compact" className="gap-1.5">
              <Plus className="size-3.5" /> Add product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit product" : "Add new product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 py-2 text-sm">
              <RequiredLegend />
              <div className="grid grid-cols-2 gap-2">
                <FormField id="p-name" label="Product name" required>
                  <Input
                    id="p-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Cerave Cleanser"
                  />
                </FormField>
                <FormField id="p-sku" label="SKU" required>
                  <Input
                    id="p-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    placeholder="SKU-1001"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField id="p-price" label="Price (BDT)" required>
                  <Input
                    id="p-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="1250"
                  />
                </FormField>
                <FormField id="p-stock" label="Stock quantity" required>
                  <Input
                    id="p-stock"
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    placeholder="50"
                  />
                </FormField>
              </div>

              {/* Brand and category had state and were submitted, but no fields
                  were rendered — so every product created here silently became
                  a Cetaphil skin-care item, uncorrectable from the UI. */}
              <div className="grid grid-cols-2 gap-2">
                <FormField id="p-brand" label="Brand" required>
                  <select
                    id="p-brand"
                    value={brandSlug}
                    onChange={(e) => setBrandSlug(e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {brands.map((b) => (
                      <option key={b.slug} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="p-category" label="Category" required>
                  <select
                    id="p-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField
                id="p-slug"
                label="URL slug"
                hint="Leave blank to generate one from the product name."
              >
                <Input
                  id="p-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={
                    name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "cerave-cleanser"
                  }
                  className="font-mono"
                />
              </FormField>

              <FormField id="p-image" label="Image URL">
                <Input
                  id="p-image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </FormField>
              <FormField id="p-brief" label="Brief description">
                <Input
                  id="p-brief"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Short product summary"
                />
              </FormField>
              <div className="flex items-center gap-6 pt-2">
                <label
                  htmlFor="p-bestseller"
                  className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                >
                  <Switch id="p-bestseller" checked={bestSeller} onCheckedChange={setBestSeller} />
                  Best seller
                </label>
                <label
                  htmlFor="p-onoffer"
                  className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                >
                  <Switch id="p-onoffer" checked={onOffer} onCheckedChange={setOnOffer} />
                  On special offer
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="compact"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingProduct ? "Save changes" : "Create product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Loading products list…</p>
      ) : isError ? (
        <p role="alert" className="py-8 text-center text-xs text-destructive">
          Could not load products: {(error as Error).message}
        </p>
      ) : products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
          No products yet. Use “Add Product” to create your first one.
        </p>
      ) : (
        // overflow-x-auto, not overflow-hidden: a 6-column table on a phone was
        // being clipped with no way to reach the last columns.
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[46rem] text-left text-xs">
            <thead className="border-b border-border bg-muted/50 font-medium text-muted-foreground">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock Status</th>
                <th className="p-3">Published</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium flex items-center gap-2">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-8 w-8 rounded object-cover border"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="line-clamp-1">{p.name}</p>
                      {p.best_seller && (
                        <span className="text-[10px] font-semibold text-gold">Best seller</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{p.sku}</td>
                  <td className="p-3 font-semibold tabular-nums">{taka(p.price)}</td>
                  <td className="p-3">
                    {p.stock <= 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                        <X className="size-3" /> Out of stock
                      </span>
                    ) : p.stock < 5 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-warning-surface px-2 py-0.5 font-medium text-warning">
                        <AlertTriangle className="size-3" /> Low ({p.stock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-success-surface px-2 py-0.5 font-medium text-success">
                        <Check className="size-3" /> In stock ({p.stock})
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <Switch
                      // Was announced as just "switch, on", with no indication
                      // of which product it unpublishes.
                      aria-label={`Publish ${p.name}`}
                      checked={p.published}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: p.id, data: { published: checked } })
                      }
                    />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => handleEdit(p)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <ConfirmDelete
                        itemName={p.name}
                        description="The product and its listing are removed permanently. Past orders keep their own copy of the name and price."
                        onConfirm={() => deleteMutation.mutate(p.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </ConfirmDelete>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && (
        <TablePager page={page} total={products.length} onPage={setPage} label="products" />
      )}
    </div>
  );
}
