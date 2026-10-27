/** Pure, independently testable PostgREST tenant guard. */
export const TENANT_TABLES = new Set([
  'suppliers','categories','products','batches','inventory','inventory_transactions',
  'prices','carts','cart_items','orders','order_items','payments','deliveries',
  'complaints','subscriptions','posts','post_interactions','post_medias',
  'reviews','group_buys','group_buy_members','audit_logs','inventory_alerts',
  'promotion_suggestions','promotions',
]);

/**
 * Server-only transport enforcement. This guard runs BEFORE service-role requests
 * leave Next.js, including legacy repository methods and mutation calls.
 * It is not a substitute for database RLS / cross-store FK checks.
 */
export function guardPostgrestRequest(urlValue, init = {}, scope) {
  if (!scope) return {url:urlValue,init};
  const url = new URL(urlValue);
  const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1]?.split('/')[0] ?? '');
  if (!TENANT_TABLES.has(table)) return {url:urlValue,init};
  if (!scope.storeIds.length) throw new Error('TENANT_DENIED: No authorized store');

  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'POST') url.searchParams.append('store_id', `in.(${scope.storeIds.join(',')})`);
  let nextInit = init;
  if (method === 'POST') {
    const pref = new Headers(init.headers).get('prefer') ?? '';
    if (pref.includes('resolution=merge-duplicates')) throw new Error('TENANT_DENIED: Unsafe tenant upsert');
    if (typeof init.body !== 'string') throw new Error('TENANT_DENIED: Unsupported insert body');
    let original;
    try { original = JSON.parse(init.body); } catch { throw new Error('TENANT_DENIED: Malformed insert body'); }
    const rows = Array.isArray(original) ? original : [original];
    if (rows.length === 0 || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row)))
      throw new Error('TENANT_DENIED: Invalid insert body');
    const scopedRows = rows.map(row => {
      const storeId = row.store_id ?? (scope.storeIds.length === 1 ? scope.storeIds[0] : null);
      if (!storeId || !scope.storeIds.includes(String(storeId))) throw new Error('TENANT_DENIED: Invalid insert store');
      return {...row,store_id:storeId};
    });
    nextInit = {...init,body:JSON.stringify(Array.isArray(original)?scopedRows:scopedRows[0])};
  }
  if (method === 'PATCH') {
    if (typeof init.body !== 'string') throw new Error('TENANT_DENIED: Unsupported update body');
    let body;
    try {body=JSON.parse(init.body);} catch {throw new Error('TENANT_DENIED: Malformed update body');}
    if (!body || Array.isArray(body) || typeof body !== 'object' || ('store_id' in body))
      throw new Error('TENANT_DENIED: Cannot change store ownership');
  }
  return {url:url.toString(),init:nextInit};
}
