import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../web-admin/backend/modules/delivery-tracking/shipper-delivery.service.ts',import.meta.url),'utf8');
test('shipper identity comes only from authenticated server session',()=>{
  assert.match(source,/verifySession\(header\.slice\(7\)\)/);
  assert.match(source,/\.eq\("user_id", identity\.id\)/);
  assert.match(source,/\.eq\("roles\.is_shipper", true\)/);
});
test('shipper reads and writes must be restricted to assigned employee',()=>{
  assert.match(source,/\.eq\("employee_id", employeeId\)/);
  assert.match(source,/\.eq\("status", current\.status\)/);
  assert.match(source,/if \(!changed\) throw new ShipperDeliveryError/);
});
test('shipper status updates are explicitly constrained',()=>{
  assert.match(source,/assigned: "picked_up", picked_up: "delivering", delivering: "delivered", delivered: null/);
  assert.match(source,/next\[current\.status as Status\] !== target/);
});
