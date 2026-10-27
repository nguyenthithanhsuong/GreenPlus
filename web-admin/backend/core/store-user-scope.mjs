/** Pure helpers: Manager list only includes employees/assigned shippers/store customers. */
export function storeUserRoleAllowed(role) {
  if (!role || typeof role !== 'object') return false;
  return Boolean(role.is_employee || role.is_shipper || role.is_customer)
    && !role.is_admin && !role.is_manager;
}
export function assignedStoreMap(storeIds, members, orders, deliveries, defaults) {
  const allowed = new Set(storeIds.map(String));
  const result = new Map();
  function add(userId, storeId) {
    if (!userId || !allowed.has(String(storeId))) return;
    const key = String(userId);
    if (!result.has(key)) result.set(key, new Set());
    result.get(key).add(String(storeId));
  }
  for (const m of members) add(m.user_id, m.store_id);
  for (const o of orders) add(o.user_id, o.store_id);
  for (const d of deliveries) add(d.employee_id, d.store_id);
  for (const u of defaults) add(u.user_id, u.store_id);
  return result;
}
export function publicStoreIds(map, userId) {
  return [...(map.get(String(userId)) ?? [])];
}
