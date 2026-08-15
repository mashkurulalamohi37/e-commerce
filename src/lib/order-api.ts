import { apiFetch } from "@/lib/api-client";

export type DeliveryZone = "inside_dhaka" | "outside_dhaka";
export type PaymentMethod = "bkash" | "card" | "cod";

export type OrderItemRecord = {
  id: string;
  product_id: string | null;
  name: string;
  size: string | null;
  qty: number;
  unit_price: number;
};

export type OrderRecord = {
  id: string;
  order_number: string;
  user_id: string | null;
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
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemRecord[];
};

export type PlaceOrderInput = {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  deliveryZone: DeliveryZone;
  paymentMethod: PaymentMethod;
  items: { productId: string; qty: number }[];
  promoCode?: string;
};

/**
 * Creates the order. Only product ids and quantities are sent — the server
 * looks up prices, checks stock and computes the total, so the amount charged
 * cannot be influenced from the browser.
 */
export function placeOrder(input: PlaceOrderInput, idempotencyKey?: string): Promise<OrderRecord> {
  return apiFetch<OrderRecord>("/orders/", {
    method: "POST",
    // One key per checkout attempt. A double-click, or a retry after the
    // connection dropped mid-request, used to place a second real order with
    // its own stock reservation and its own delivery.
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    body: JSON.stringify({
      customer_name: input.customerName.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      delivery_zone: input.deliveryZone,
      payment_method: input.paymentMethod,
      promo_code: input.promoCode?.trim() || null,
      items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty })),
    }),
  });
}

/** Confirms payment and decrements stock. The phone proves the caller placed it. */
export function payOrder(orderId: string, phone: string): Promise<OrderRecord> {
  return apiFetch<OrderRecord>(`/orders/${orderId}/pay`, {
    method: "POST",
    body: JSON.stringify({ phone: phone.trim() }),
  });
}

/**
 * Orders belonging to the signed-in customer. Scoped server-side to the user in
 * the token — the caller cannot ask for anyone else's.
 */
export function fetchMyOrders(): Promise<OrderRecord[]> {
  return apiFetch<OrderRecord[]>("/orders/my");
}

export type ValidatedPromo = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  is_valid: boolean;
  calculated_discount: number;
};

/**
 * Checks a promo code against the current subtotal before the order is placed,
 * so the customer sees the discount rather than discovering it afterwards. The
 * server recomputes it at order time regardless — this is display only.
 */
export function validatePromo(code: string, subtotal: number): Promise<ValidatedPromo> {
  return apiFetch<ValidatedPromo>("/feedback/promotions/validate", {
    method: "POST",
    anonymous: true,
    body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal }),
  });
}

/** Order lookup needs both the number and the phone it was placed with. */
export function trackOrder(orderNumber: string, phone: string): Promise<OrderRecord> {
  const params = new URLSearchParams({
    order_number: orderNumber.trim().toUpperCase(),
    phone: phone.trim(),
  });
  return apiFetch<OrderRecord>(`/orders/track?${params.toString()}`, { anonymous: true });
}
