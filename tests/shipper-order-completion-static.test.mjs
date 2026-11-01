import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('shipper only changes delivery; database trigger completes parent order in same transaction', () => {
 const sql = read('supabase/migrations/0014_complete_order_on_delivery.sql');
 assert.match(sql, /AFTER UPDATE OF status ON public\.deliveries/);
 assert.match(sql, /NEW\.status = 'delivered'/);
 assert.match(sql, /OLD\.status IS DISTINCT FROM NEW\.status/);
 assert.match(sql, /FOR UPDATE/);
 assert.match(sql, /o\.store_id = NEW\.store_id/);
 assert.match(sql, /v_order_status <> 'delivering'/);
 assert.match(sql, /SET status = 'completed'/);
 assert.match(sql, /BEGIN;[\s\S]*COMMIT;/);
});

test('backfill only updates delivering orders with a delivered record in the same store', () => {
 const sql = read('supabase/migrations/0014_complete_order_on_delivery.sql');
 assert.match(sql, /WHERE o\.status = 'delivering'/);
 assert.match(sql, /d\.store_id = o\.store_id/);
 assert.match(sql, /d\.status = 'delivered'/);
});

test('Admin fallback checks order state first to avoid duplicate completion', () => {
 const facade = read('web-admin/backend/modules/delivery-tracking/facades/delivery-tracking.facade.ts');
 assert.match(facade, /order\.status === "delivering"/);
 const ui = read('web-admin/frontend/orders/OrderManagement.tsx');
 assert.match(ui, /useAutoReload\(reloadOrdersQuietly, 10000\)/);
 const trackingUi = read('web-admin/frontend/shippers/ShipperManagement.tsx');
 assert.match(trackingUi, /useAutoReload\(reloadDeliveriesQuietly, 10000\)/);
});
