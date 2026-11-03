import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const gate = read('../docker/three-tier/gateway/server.mjs');
const boot = read('../scripts/three-tier-docker.mjs');
for (const location of ['shared','enterprise-a','enterprise-b']) {
 const sql=read(`../docker/three-tier/sql/${location}/003_inventory_orders.sql`);
 test(`${location}: inventory and order upgrade is atomic and re-runnable`,()=>{
  assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;/);
  for (const table of ['inventory_stock','commerce_orders','commerce_order_items']) assert.match(sql,new RegExp(`CREATE TABLE IF NOT EXISTS .*\\.${table}`));
  for (const name of ['demo_restock','demo_checkout','demo_cancel_order']) assert.match(sql,new RegExp(`CREATE OR REPLACE FUNCTION .*\\.${name}`));
 });
 test(`${location}: quantity constraints and atomic decrement are enforced in database`,()=>{
  assert.match(sql,/CHECK \(available>=0\)/);
  assert.match(sql,/i\.available>=line\.quantity/);
  assert.match(sql,/pg_advisory_xact_lock/);
  assert.match(sql,/status='pending'/);
  assert.match(sql,/PRIMARY KEY \(store_id,product_id\)/);
  assert.match(sql,/p\.store_id=p_store/);
 });
 test(`${location}: no direct mutation grant on commerce tables`,()=>{
  assert.match(sql,/REVOKE ALL ON .*inventory_stock.*commerce_orders/);
  assert.match(sql,/GRANT SELECT ON .*inventory_stock/);
  assert.doesNotMatch(sql,/GRANT SELECT, INSERT, UPDATE, DELETE ON .*commerce_orders/);
 });
}
test('gateway isolates RPC route via registered store and validates every field',()=>{
 assert.match(gate,/await resolveStore\(storeId\)/);
 assert.match(gate,/Object\.keys\(body\)\.length !== 2/);
 assert.match(gate,/\/rpc\/\$\{fn\}/);
 assert.match(gate,/p_store:storeId/);
 assert.match(gate,/actionMatch/);
});
test('bootstrap upgrades volumes with 003 after 002',()=>{
 assert.ok(boot.indexOf('002_product_category_slice.sql')<boot.indexOf('003_inventory_orders.sql'));
 assert.match(boot,/ON_ERROR_STOP=1/);
});
