import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Shipper routes call local services, never a Web Admin URL', () => {
  const routes = [
    '../src/app/api/auth/sign-in/route.ts',
    '../src/app/api/auth/me/route.ts',
    '../src/app/api/shipper/deliveries/route.ts',
    '../src/app/api/shipper/deliveries/[orderId]/status/route.ts',
  ];
  for (const path of routes) {
    const content = read(path);
    assert.doesNotMatch(content, /shipperBaseUrl|authenticateWithAdmin|makeDeliveryApi|localhost:3001|fetch\(.*\/shipper/);
    assert.match(content, /\.\.\/.*server\/shipper-/);
  }
});

test('Shipper database uses server-side service role and explicit row ownership', () => {
  const db = read('../src/server/shipper-db.ts');
  const auth = read('../src/server/shipper-auth.ts');
  const delivery = read('../src/server/shipper-deliveries.ts');
  assert.match(db, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(db, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(auth, /roles!inner\(is_shipper\)/);
  assert.match(auth, /\.eq\('roles\.is_shipper', true\)/);
  assert.match(delivery, /\.eq\('employee_id', user\.user_id\)/);
  assert.match(delivery, /row\.orders\.store_id === row\.store_id/);
  assert.match(delivery, /\.from\('store_members'\)/);
  assert.match(delivery, /\.eq\('status', 'active'\)/);
  assert.match(delivery, /\.eq\('status', currentStatus\)/);
  assert.match(auth, /verifyShipperSession/);
});
