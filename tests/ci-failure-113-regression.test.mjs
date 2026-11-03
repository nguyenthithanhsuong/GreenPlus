import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('0006 accepts only genuinely empty zero-store bootstrap and still rejects ambiguous legacy backfill', () => {
  const sql = read('supabase/migrations/0006_backfill_existing_store.sql');
  assert.match(sql, /IF n = 1 THEN\s+RETURN;/);
  assert.match(sql, /IF n > 1 THEN\s+RAISE EXCEPTION/);
  assert.match(sql, /IF has_legacy_rows THEN\s+RAISE EXCEPTION/);
  for (const table of ['users', 'orders', 'products', 'inventory', 'deliveries']) {
    assert.ok(sql.includes(`'${table}'`), `${table} must be included in zero-store safety guard`);
  }
  assert.match(sql, /WHERE store_id IS NULL/);
});

test('shipper E2E identifies the password input unambiguously', () => {
  const spec = read('web-shipper/e2e/shipper.spec.ts');
  assert.ok(!spec.includes('getByLabel("Mật khẩu")'));
  assert.match(spec, /getByLabel\("Mật khẩu", \{ exact: true \}\)/);
});

test('shipper CI E2E supplies ephemeral signing secret without production secrets', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.match(workflow, /Shipper browser E2E tests[\s\S]*?SHIPPER_SESSION_SECRET: ci-only-shipper-session-key-not-for-production-2026/);
  assert.match(workflow, /npm run test:e2e -w web-shipper/);
});
