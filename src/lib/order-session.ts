/**
 * Remembers order credentials so /track and the confirmation page automatically
 * show live tracking without requiring the customer to manually search.
 */
const key = (orderNumber: string) => `nillsmart_order_${orderNumber.toUpperCase()}`;

export function rememberOrderPhone(orderNumber: string, phone: string, email?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({ phone, email: email || null });
    window.sessionStorage.setItem(key(orderNumber), payload);
    window.localStorage.setItem("nillsmart_last_order", JSON.stringify({ orderNumber: orderNumber.toUpperCase(), phone, email }));
  } catch {
    /* private mode */
  }
}

export function rememberedPhone(orderNumber: string): string {
  if (typeof window === "undefined" || !orderNumber) return "";
  try {
    const stored = window.sessionStorage.getItem(key(orderNumber));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.phone || (typeof parsed === "string" ? parsed : "");
      } catch {
        return stored;
      }
    }
    // Fallback to last order in localStorage if order numbers match
    const last = window.localStorage.getItem("nillsmart_last_order");
    if (last) {
      const parsed = JSON.parse(last);
      if (parsed.orderNumber === orderNumber.toUpperCase()) {
        return parsed.phone || "";
      }
    }
    return "";
  } catch {
    return "";
  }
}

export function rememberedEmail(orderNumber: string): string {
  if (typeof window === "undefined" || !orderNumber) return "";
  try {
    const stored = window.sessionStorage.getItem(key(orderNumber));
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.email || "";
    }
    const last = window.localStorage.getItem("nillsmart_last_order");
    if (last) {
      const parsed = JSON.parse(last);
      if (parsed.orderNumber === orderNumber.toUpperCase()) {
        return parsed.email || "";
      }
    }
    return "";
  } catch {
    return "";
  }
}

export function getLastPlacedOrder(): { orderNumber: string; phone: string; email?: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem("nillsmart_last_order");
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch {
    return null;
  }
}
