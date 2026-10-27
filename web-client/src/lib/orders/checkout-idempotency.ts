/** Stable checkout request key across network retries/reloads in a browser tab.
 * One key is generated per (user, store, cart, cart content + checkout settings).
 * Do not reset on timeouts/5xx: the server may have already committed an order.
 */
export type CheckoutItem = { cart_item_id: string; quantity: number; note?: string | null };
export type CheckoutContext = {
  userId: string;
  storeId: string;
  cartId: string;
  items: CheckoutItem[];
  deliveryAddress: string;
  deliveryFee: number;
  paymentMethod?: string;
  note?: string;
};

function storageKey(context: CheckoutContext): string {
  return `greenplus:checkout:v1:${context.userId}:${context.storeId}:${context.cartId}`;
}

function fingerprint(context: CheckoutContext): string {
  // JSON contains no secrets; persisted value below is only a lightweight digest.
  const source = JSON.stringify({
    items: [...context.items]
      .map((item) => [item.cart_item_id, item.quantity, item.note ?? ""])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    deliveryAddress: context.deliveryAddress.trim(),
    deliveryFee: context.deliveryFee,
    paymentMethod: context.paymentMethod ?? "cod",
    note: context.note?.trim() ?? "",
  });
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${source.length}:${(hash >>> 0).toString(16)}`;
}

function generateKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const values = new Uint8Array(16);
    crypto.getRandomValues(values);
    return `gp-${Array.from(values, (n) => n.toString(16).padStart(2, "0")).join("")}`;
  }
  // Only a last-resort legacy fallback. Idempotency key is not an auth token.
  return `gp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function getCheckoutIdempotencyKey(context: CheckoutContext): string {
  const key = storageKey(context);
  const signature = fingerprint(context);
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const stored = JSON.parse(raw) as { signature?: string; value?: string };
      if (stored.signature === signature &&
          typeof stored.value === "string" &&
          /^[A-Za-z0-9._:-]{8,128}$/.test(stored.value)) {
        return stored.value;
      }
    }
  } catch { /* storage blocked or stale entry: create a new key */ }

  const value = generateKey();
  try { sessionStorage.setItem(key, JSON.stringify({ signature, value })); }
  catch { /* private browsing may block storage */ }
  return value;
}

/** Clear only after receiving a successful checkout response from the server. */
export function clearCheckoutIdempotencyKey(context: CheckoutContext): void {
  try { sessionStorage.removeItem(storageKey(context)); }
  catch { /* storage may be unavailable */ }
}
