/**
 * Remembers which phone number an order was placed with, so /track and the
 * confirmation page don't challenge a customer for a detail they just typed.
 *
 * Same-origin, cleared when the tab closes. This is a convenience only — the
 * API still requires the number to match before it returns anything.
 */
const key = (orderNumber: string) => `nillsmart_order_${orderNumber.toUpperCase()}`;

export function rememberOrderPhone(orderNumber: string, phone: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key(orderNumber), phone);
  } catch {
    /* private mode — /track will ask for the phone instead */
  }
}

export function rememberedPhone(orderNumber: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(key(orderNumber)) ?? "";
  } catch {
    return "";
  }
}
