import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ticket, Plus, Trash2, Tag, CheckCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { taka } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, RequiredLegend } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  is_active: boolean;
}

export function PromotionsPanel() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("0");

  const {
    data: promos = [],
    isLoading,
    isError,
    error,
  } = useQuery<PromoCode[]>({
    queryKey: ["admin", "promotions"],
    queryFn: () => apiFetch("/feedback/promotions/admin/list"),
  });

  const createMutation = useMutation({
    mutationFn: (newPromo: any) =>
      apiFetch("/feedback/promotions", { method: "POST", body: JSON.stringify(newPromo) }),
    onSuccess: () => {
      toast.success("Promo code created!");
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/feedback/promotions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Promo code deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setCode("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrder("0");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Please fill in code and discount value");
      return;
    }

    createMutation.mutate({
      code: code.trim().toUpperCase(),
      description: description.trim(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_order_amount: parseFloat(minOrder || "0"),
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl font-bold shadow-sm">
              <Plus className="size-4" />
              Create promo code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">New promo code</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <RequiredLegend />

              <FormField
                id="promo-code"
                label="Promo code"
                required
                hint="Shown to customers exactly as typed."
              >
                <Input
                  id="promo-code"
                  aria-describedby="promo-code-hint"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="font-mono uppercase"
                  required
                />
              </FormField>

              <FormField id="promo-description" label="Description">
                <Input
                  id="promo-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="10% off all orders"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField id="promo-type" label="Discount type" required>
                  <select
                    id="promo-type"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed BDT (৳)</option>
                  </select>
                </FormField>
                <FormField id="promo-value" label="Discount value" required>
                  <Input
                    id="promo-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percentage" ? "15" : "150"}
                    required
                  />
                </FormField>
              </div>

              <FormField id="promo-min" label="Minimum order amount (BDT)">
                <Input
                  id="promo-min"
                  type="number"
                  min="0"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="500"
                />
              </FormField>

              <Button
                type="submit"
                className="w-full font-bold"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Save promo code"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading promo codes…</p>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-destructive">
          Error: {(error as Error).message}
        </p>
      ) : promos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Ticket className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-bold text-foreground">No promo codes yet</p>
          <p className="text-xs text-muted-foreground">
            Use “Create promo code” to add your first voucher. Customers enter it at checkout.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((p) => (
            <div
              key={p.id}
              className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/90 p-5 shadow-card backdrop-blur-sm transition-all hover:shadow-lift"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1 font-mono text-sm font-extrabold uppercase tracking-wide text-link">
                    <Tag className="size-3.5" />
                    {p.code}
                  </span>
                  {/* Was hardcoded to "Active" regardless of is_active, so a
                      disabled code looked live. */}
                  {p.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                      <CheckCircle className="size-3.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <AlertCircle className="size-3.5" /> Inactive
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {p.description || "Discount Voucher"}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-extrabold text-foreground">
                    {p.discount_type === "percentage"
                      ? `${p.discount_value}% OFF`
                      : taka(p.discount_value)}
                  </span>
                </div>
                {p.min_order_amount > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Min order:{" "}
                    <span className="font-bold text-foreground">{taka(p.min_order_amount)}</span>
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end border-t border-border/60 pt-3">
                <ConfirmDelete
                  itemName={`Promo Code ${p.code}`}
                  description={`Are you sure you want to delete '${p.code}'?`}
                  onConfirm={() => deleteMutation.mutate(p.id)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </ConfirmDelete>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
