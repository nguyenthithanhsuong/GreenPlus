import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
test('Admin Docker catalog proxy requires admin role and Docker cookie', () => {
  const source = read('../web-admin/src/app/api/tenant-demo/catalog/route.ts');
  assert.match(source, /actor\.role !== "admin"/);
  assert.match(source, /greenplus_admin_storage_view/);
  assert.match(source, /Select Docker Local/);
  assert.match(source, /Forbidden origin/);
  assert.match(source, /localhost/);
  assert.match(source, /uuid\.test\(storeId\)/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_DOCKER_GATEWAY_KEY/);
});
test('Admin catalog offers CRUD through local proxy, never direct Supabase', () => {
  const ui = read('../web-admin/frontend/settings/DockerCatalogManager.tsx');
  for (const method of ['POST','PATCH','DELETE']) assert.match(ui, new RegExp(`method: "${method}"`));
  assert.match(ui, /\/api\/tenant-demo\/catalog/);
  assert.doesNotMatch(ui, /supabase\.from/);
  assert.match(read('../web-admin/src/app/settings/tenant-demo/page.tsx'), /<DockerCatalogManager/);
});
test('Storage preference remains a single accessible switch', () => {
  const ui = read('../web-admin/frontend/settings/StorageModeSetting.tsx');
  assert.match(ui, /role="switch"/);
  assert.match(ui, /aria-checked/);
  assert.doesNotMatch(ui, /Lưu ý:/);
});
