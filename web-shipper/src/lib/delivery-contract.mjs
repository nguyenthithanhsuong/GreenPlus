// Public delivery contract shared by server adapter and Node integration tests.
export const DELIVERY_STATUSES = Object.freeze(['assigned', 'picked_up', 'delivering', 'delivered']);
export function normalizeDelivery(row) {
  if (!row || typeof row !== 'object' || typeof row.order_id !== 'string') throw new TypeError('Invalid delivery row');
  if (!DELIVERY_STATUSES.includes(row.status)) throw new TypeError('Unsupported delivery status');
  return {
    order_id: row.order_id, delivery_id: String(row.delivery_id ?? ''),
    customer_name: String(row.customer_name ?? 'Khách hàng'),
    delivery_address: String(row.delivery_address ?? ''),
    total_amount: Number.isFinite(Number(row.total_amount)) ? Number(row.total_amount) : 0,
    status: row.status, pickup_time: row.pickup_time ?? null,
  };
}
export function allowedTransition(from, to) {
  return ({assigned: ['picked_up'], picked_up: ['delivering'], delivering: ['delivered'], delivered: []}[from] ?? []).includes(to);
}
export function safeOrderId(id) { return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id); }
