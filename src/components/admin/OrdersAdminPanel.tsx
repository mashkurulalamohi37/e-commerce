import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  MapPin,
  Search,
  Download,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { taka } from "@/lib/catalog";
import { exportToCSV } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PAGE_SIZE, TablePager } from "@/components/admin/TablePager";

export interface OrderItemRecord {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  delivery_zone: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  payment_reference?: string;
  created_at: string;
  items: OrderItemRecord[];
}

/** Semantic tokens rather than raw palette values, so these follow the theme. */
const statusBadges: Record<string, { label: string; bg: string; icon: any }> = {
  pending: {
    label: "Pending",
    bg: "bg-warning-surface text-warning border-warning/30",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    bg: "bg-info-surface text-info border-info/30",
    icon: ShoppingBag,
  },
  shipped: { label: "Shipped", bg: "bg-accent text-accent-foreground border-border", icon: Truck },
  delivered: {
    label: "Delivered",
    bg: "bg-success-surface text-success border-success/30",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-destructive/10 text-destructive border-destructive/30",
    icon: XCircle,
  },
};

export function OrdersAdminPanel() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  const { data: orders = [], isLoading } = useQuery<OrderRecord[]>({
    queryKey: ["admin", "orders"],
    queryFn: () => apiFetch("/orders/admin/list"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
      paymentStatus,
    }: {
      orderId: string;
      status?: string;
      paymentStatus?: string;
    }) =>
      apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, payment_status: paymentStatus }),
      }),
    onSuccess: () => {
      toast.success("Order status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update order status"),
  });

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    const matchesSearch =
      !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search);
    return matchesStatus && matchesSearch;
  });

  const pageOrders = filteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Filtering while on page 3 would otherwise leave you staring at an empty table.
  useEffect(() => setPage(0), [search, filterStatus]);

  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      toast.error("No orders to export");
      return;
    }
    const exportData = filteredOrders.map((o) => ({
      "Order Number": o.order_number,
      Date: new Date(o.created_at).toLocaleString(),
      Customer: o.customer_name,
      Phone: o.phone,
      City: o.city,
      "Items Count": o.items.reduce((acc, i) => acc + i.qty, 0),
      "Total Price (BDT)": o.total,
      "Payment Method": o.payment_method,
      "Payment Status": o.payment_status,
      "Order Status": o.status,
    }));
    exportToCSV("nills_mart_orders", exportData);
    toast.success("Orders exported to CSV!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-end gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-56">
          <label htmlFor="orders-search" className="sr-only">
            Search orders by number, name or phone
          </label>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="orders-search"
            placeholder="Search order #, name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-xs"
          />
        </div>
        <div>
          <label htmlFor="orders-status" className="sr-only">
            Filter by status
          </label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger id="orders-status" className="h-9 w-36 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="compact"
          onClick={handleExportCSV}
          className="h-9 gap-1.5 font-bold"
        >
          <Download className="size-3.5 text-link" /> Export CSV
        </Button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Loading orders list…</p>
      ) : (
        // overflow-x-auto, not overflow-hidden: a 7-column table on a phone was
        // being clipped with no way to reach the last columns.
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[52rem] text-left text-xs">
            <thead className="border-b border-border bg-muted/50 font-medium text-muted-foreground">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No orders matching criteria.
                  </td>
                </tr>
              ) : (
                pageOrders.map((o) => {
                  const badge = statusBadges[o.status] || statusBadges.pending;
                  const Icon = badge.icon;
                  return (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-semibold">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="text-link hover:underline"
                        >
                          {o.order_number}
                        </button>
                        <p className="text-[10px] text-muted-foreground font-normal">
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{o.customer_name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />
                          {o.phone}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold">{o.items?.length || 0} items</span>
                      </td>
                      {/* Was green on every row, which made the colour mean nothing. */}
                      <td className="p-3 font-semibold tabular-nums">{taka(o.total)}</td>
                      <td className="p-3">
                        <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted">
                          {o.payment_method}
                        </span>
                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                          {o.payment_status}
                        </p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg}`}
                        >
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Select
                          value={o.status}
                          onValueChange={(val) =>
                            updateStatusMutation.mutate({ orderId: o.id, status: val })
                          }
                        >
                          <SelectTrigger
                            aria-label={`Update status for order ${o.order_number}`}
                            className="ml-auto h-8 w-32 text-[11px]"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && (
        <TablePager page={page} total={filteredOrders.length} onPage={setPage} label="orders" />
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Order {selectedOrder.order_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-xs py-2">
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <p className="font-semibold">{selectedOrder.customer_name}</p>
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {selectedOrder.phone}
                </p>
                <p className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {selectedOrder.address}, {selectedOrder.city}
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Ordered Items</p>
                <ul className="divide-y divide-border border rounded-lg overflow-hidden">
                  {selectedOrder.items?.map((item, idx) => (
                    <li key={idx} className="p-2 flex justify-between">
                      <span>
                        {item.name} x {item.qty}
                      </span>
                      <span className="font-medium">{taka(item.unit_price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1 text-right pt-1 font-medium">
                <p className="text-muted-foreground">Subtotal: {taka(selectedOrder.subtotal)}</p>
                <p className="text-muted-foreground">
                  Delivery Fee: {taka(selectedOrder.delivery_fee)}
                </p>
                {selectedOrder.discount_amount > 0 && (
                  <p className="text-success">Discount: −{taka(selectedOrder.discount_amount)}</p>
                )}
                <p className="text-sm font-bold text-foreground">
                  Total: {taka(selectedOrder.total)}
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
