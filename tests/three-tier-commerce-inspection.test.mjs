import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
test('commerce read-only gateway is tenant-filtered and uses tenant-specific schema', () => {
  const server = read('../docker/three-tier/gateway/server.mjs');
  assert.match(server, /async function inspectCommerce\(storeId, resource, orderId\)/);
  assert.match(server, /const scope = `store_id=eq\.\$\{storeId\}`/);
  assert.match(server, /resolveStore\(storeId\)/);
  assert.match(server, /commerce_order_items\?select=/);
  assert.match(server, /req.method === "GET" && readMatch/);
});
test('Admin commerce proxy reads and restricts privileged sandbox writes to admin Docker mode', () => {
  const source = read('../web-admin/src/app/api/tenant-demo/commerce/route.ts');
  assert.match(source, /actor.role !== "admin"/);
  assert.match(source, /greenplus_admin_storage_view/);
  assert.match(source, /export async function GET/);
  assert.match(source, /export async function POST/);
  assert.match(source, /origin !== new URL\(request.url\).origin/);
  assert.doesNotMatch(source, /export async function DELETE|export async function PATCH/);
  assert.match(source, /fetchDockerGateway/);
  assert.match(read('../web-admin/backend/core/docker-gateway.mjs'), /localhost/);
});
test('non-destructive smoke checks exercise live inventory and orders', () => {
  const src = read('../scripts/three-tier-docker.mjs');
  assert.match(src, /\['inventory', 'orders'\]/);
  assert.match(src, /Tenant-isolated \${kind} inspection failed/);
});
