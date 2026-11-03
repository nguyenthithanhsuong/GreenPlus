import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('0010 supports a truly empty zero-store bootstrap without weakening legacy mapping protection', () => {
  const sql = read('supabase/migrations/0010_transition_diagnostics.sql');
  assert.match(sql, /IF store_count = 0 THEN/);
  assert.match(sql, /IF has_rows THEN\s+RAISE EXCEPTION/);
  assert.match(sql, /ELSIF store_count > 1 THEN/);
  assert.match(sql, /WHERE store_id IS NULL/);
  for (const table of ['users', 'orders', 'products', 'inventory', 'deliveries']) {
    assert.ok(sql.includes(`'${table}'`), `missing zero-store guard for ${table}`);
  }
  assert.doesNotMatch(sql, /IF store_count <> 1 THEN/);
});

test('Shipper login UI test mocks rejected credentials and checks the actual POST', () => {
  const spec = read('web-shipper/e2e/shipper.spec.ts');
  assert.match(spec, /page\.route\("\*\*\/api\/auth\/sign-in"/);
  assert.match(spec, /expect\(credentials\)\.toEqual/);
  assert.match(spec, /status: 401/);
  assert.match(spec, /toContainText\("Email hoặc mật khẩu không đúng"\)/);
  assert.match(spec, /expect\(response\.status\(\)\)\.toBe\(401\)/);
  assert.match(spec, /errorBounds\.width - originalBounds\.width/);
});
