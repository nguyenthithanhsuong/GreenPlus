import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const gateway=read('docker/three-tier/gateway/server.mjs');
const admin=read('web-admin/src/app/api/tenant-demo/commerce/route.ts');
const bootstrap=read('scripts/three-tier-docker.mjs');
for(const path of ['docker/three-tier/sql/shared/004_payment_delivery_simulation.sql',
 'docker/three-tier/sql/enterprise-a/004_payment_delivery_simulation.sql',
 'docker/three-tier/sql/enterprise-b/004_payment_delivery_simulation.sql']) {
 test(`${path} is transactional and idempotent`,()=>{
  const sql=read(path);
  assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;/);
  assert.match(sql,/ADD COLUMN IF NOT EXISTS payment_status/);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS .*commerce_deliveries/);
  assert.match(sql,/demo_confirm_payment/);assert.match(sql,/demo_assign_delivery/);assert.match(sql,/demo_complete_delivery/);
  assert.match(sql,/payment_status <> 'unpaid'/);
  assert.match(sql,/FOR UPDATE/);
  assert.match(sql,/WHERE store_id=p_store AND order_id=p_order/);
 });
}
test('gateway restricts fulfillment to named store/order UUID routes',()=>{
 assert.match(gateway,/fulfillmentMatch.*simulate-payment\|assign-delivery\|complete-delivery/);
 assert.match(gateway,/uuid\.test\(fulfillmentMatch\[1\]\).*uuid\.test\(fulfillmentMatch\[2\]\)/);
 assert.match(gateway,/Object\.keys\(body\)\.length !== 0/);
 assert.match(gateway,/p_assignee:body\.assigned_to\.trim\(\)/);
});
test('Admin commerce writes are admin-only and require a selected Docker mode, same origin and local gateway',()=>{
 assert.match(admin,/actor\.role !== "admin"/);
 assert.match(admin,/greenplus_admin_storage_view/);
 assert.match(admin,/origin !== new URL\(request\.url\)\.origin/);
 assert.match(admin,/GREENPLUS_DOCKER_GATEWAY_KEY/);
 assert.match(admin,/localhost","127\.0\.0\.1/);
 assert.match(admin,/"simulate-payment","assign-delivery","complete-delivery"/);
});
test('existing volumes execute 004 after 003 on all databases',()=>{
 assert.ok(bootstrap.indexOf("003_inventory_orders.sql") < bootstrap.indexOf("004_payment_delivery_simulation.sql"));
 assert.match(bootstrap,/enterprise-b-db/);
});
test('Docker lifecycle integration test always ends in rollback',()=>{
 const sql=read('scripts/test-three-tier-lifecycle.mjs');
 assert.match(sql,/ROLLBACK;/);
 assert.match(sql,/Cross-store payment allowed/);
 assert.match(sql,/Paid order cancellation allowed/);
 assert.match(sql,/Expected exactly three lifecycle events/);
});

for (const path of ['docker/three-tier/sql/shared/003_inventory_orders.sql','docker/three-tier/sql/enterprise-a/003_inventory_orders.sql','docker/three-tier/sql/enterprise-b/003_inventory_orders.sql']) {
 test(`${path} rejects reused checkout order ID with different items`,()=>{
  assert.match(read(path),/Order idempotency payload mismatch/);
 });
}

test('bootstrap reloads PostgREST schema cache after database upgrades',()=>{
 assert.match(bootstrap,/NOTIFY pgrst, 'reload schema'/);
 assert.ok(bootstrap.indexOf('004_payment_delivery_simulation.sql') < bootstrap.indexOf('NOTIFY pgrst'));
});

test('main Admin Orders and Inventory pages switch to Docker commerce workspace without routing Supabase screens',()=>{
 for (const [page,kind] of [['orders','orders'],['inventories','inventory']]) {
  const source=read(`web-admin/src/app/${page}/page.tsx`);
  assert.match(source,/greenplus_admin_storage_view/);
  assert.match(source,/GREENPLUS_TENANCY_DEMO/);
  assert.match(source,new RegExp(`DockerCommerceWorkspace kind="${kind}"`));
 }
});
