import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { listTenantCollection } from '../web-admin/backend/core/tenant-list-pages.mjs';
const source = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');

test('tenant read pagination fetches all pages without fallback', async () => {
  const calls = [];
  const adapter = { list: async (table, options) => {
    calls.push({table, ...options});
    if (options.offset === 0) return [{id: 1},{id: 2}];
    return [{id: 3}];
  }};
  assert.deepEqual(await listTenantCollection(adapter, 'categories', {pageSize:2,maxRows:6}), [{id:1},{id:2},{id:3}]);
  assert.deepEqual(calls.map(x=>x.offset), [0,2]);
});
test('tenant read pagination fails closed at cap and upstream errors', async () => {
  const full = {list: async () => [{id:1},{id:2}]};
  await assert.rejects(listTenantCollection(full, 'products', {pageSize:2,maxRows:4}), /exceeded/);
  await assert.rejects(listTenantCollection({list: async()=>{throw new Error('offline')}}, 'categories'), /offline/);
});
test('category read pilot retains the same route for category rows and product counts', () => {
  const code = source('web-admin/backend/modules/categories/category-management.repository.ts');
  assert.match(code, /tenantCategoryReadsEnabled\(\) && activeTenantScope\(\)/);
  assert.match(code, /tenantDataForActiveStore\(\)/);
  assert.match(code, /listTenantCollection\(adapter, "categories"\)/);
  assert.match(code, /listTenantCollection\(adapter, "products"\)/);
  assert.match(source('web-admin/backend/core/tenant-data.ts'), /GREENPLUS_TENANT_DATA_READ_CATEGORIES === "true"/);
});
