/** Read-only pagination over an already-authorized tenant adapter. No fallback. */
export async function listTenantCollection(adapter, collection, { pageSize = 500, maxRows = 20000 } = {}) {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 500 ||
      !Number.isInteger(maxRows) || maxRows < pageSize) {
    throw new Error('Invalid tenant pagination bounds');
  }
  const rows = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const page = await adapter.list(collection, { limit: Math.min(pageSize, maxRows - offset), offset });
    if (!Array.isArray(page)) throw new Error('Invalid tenant page');
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
  // A full last page cannot prove there are no more rows; fail closed rather than truncate.
  throw new Error('Tenant collection listing exceeded safe paging limit');
}
