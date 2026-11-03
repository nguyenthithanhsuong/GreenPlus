import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Docker mode renders Docker catalog on both main Admin routes', () => {
  for (const [page, kind] of [['products', 'catalog-products'], ['categories', 'categories']]) {
    const source = read(`web-admin/src/app/${page}/page.tsx`);
    assert.match(source, /cookies\(\)/);
    assert.match(source, /greenplus_admin_storage_view/);
    assert.match(source, /GREENPLUS_TENANCY_DEMO/);
    assert.ok(source.includes(`<DockerCatalogWorkspace kind="${kind}" />`));
  }
});

test('Docker workspace only uses the guarded Admin proxy', () => {
  const source = read('web-admin/frontend/settings/DockerCatalogWorkspace.tsx');
  assert.match(source, /\/api\/tenant-demo/);
  assert.doesNotMatch(source, /supabase\.from|NEXT_PUBLIC_DOCKER_GATEWAY_KEY/);
  assert.match(source, /DockerCatalogManager/);
  const manager = read('web-admin/frontend/settings/DockerCatalogManager.tsx');
  assert.match(manager, /lockedKind/);
  assert.match(manager, /\/api\/tenant-demo\/catalog/);
});

test('Local development port assignment follows requested roles', () => {
  const admin = JSON.parse(read('web-admin/package.json'));
  const client = JSON.parse(read('web-client/package.json'));
  assert.match(admin.scripts.dev, /-p 3000$/);
  assert.match(client.scripts.dev, /-p 3001$/);
});
