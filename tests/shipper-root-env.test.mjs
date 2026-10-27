import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureShipperSecret } from '../scripts/setup-shipper-env.mjs';

const config = readFileSync(new URL('../web-shipper/next.config.ts', import.meta.url), 'utf8');

test('Shipper reads exactly the same root .env as Admin/Client', () => {
  for (const app of ['web-admin', 'web-client']) {
    const peer = readFileSync(new URL(`../${app}/next.config.ts`, import.meta.url), 'utf8');
    assert.match(peer, /loadEnv\(\{ path: resolve\(process\.cwd\(\), "\.\.\/\.env"\) \}\)/);
  }
  assert.match(config, /loadEnv\(\{ path: resolve\(process\.cwd\(\), "\.\.\/\.env"\) \}\)/);
  assert.doesNotMatch(config, /\.env\.local|localhost:3001|GREENPLUS_SHIPPER_API_BASE_URL/);
});

test('Setup adds session secret only to root env without changing existing config', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gp-shipper-env-'));
  try {
    const path = join(dir, '.env');
    const input = 'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=serveronly\n';
    writeFileSync(path, input);
    assert.equal(ensureShipperSecret(path, () => 'a'.repeat(64)), 'created');
    const updated = readFileSync(path, 'utf8');
    assert.ok(updated.startsWith(input));
    assert.match(updated, /^SHIPPER_SESSION_SECRET=a{64}$/m);
    assert.equal(ensureShipperSecret(path), 'exists');
    assert.equal(readFileSync(path, 'utf8'), updated);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Setup refuses missing base env or weak existing secret', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gp-shipper-env-'));
  try {
    const path = join(dir, '.env');
    writeFileSync(path, 'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co\n');
    assert.throws(() => ensureShipperSecret(path), /SUPABASE_SERVICE_ROLE_KEY/);
    writeFileSync(path, 'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=key\nSHIPPER_SESSION_SECRET=weak\n');
    assert.throws(() => ensureShipperSecret(path), /quá ngắn/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
