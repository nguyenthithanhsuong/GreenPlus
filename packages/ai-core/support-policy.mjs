export function canAccessOrderThread(actor, thread) {
  if (!actor || !thread || !actor.userId || !actor.role || !actor.storeIds?.includes(thread.store_id)) return false;
  if (actor.role === "customer") return thread.customer_id === actor.userId;
  if (actor.role === "shipper") return thread.shipper_id === actor.userId;
  if (actor.role === "employee" || actor.role === "manager") return true;
  if (actor.role === "admin") return actor.escalated === true;
  return false;
}
export function canStartThread(actor, order) {
  if (!actor?.storeIds?.includes(order.store_id)) return false;
  if (actor.role === "customer") return order.user_id === actor.userId;
  if (actor.role === "shipper") return order.shipper_id === actor.userId;
  return actor.role === "employee" || actor.role === "manager";
}
