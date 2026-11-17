import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');

test('Shipper loads the same root environment file as Admin and Client', () => {
  for (const app of ['web-admin','web-client','web-shipper']) {
    assert.match(read(`../${app}/next.config.ts`), /loadEnv\(\{ path: resolve\(process\.cwd\(\), "\.\.\/\.env"\) \}\)/);
  }
});

test('Shipper shares existing Auth signing key, no app-specific secret setup', () => {
  const auth = read('../web-shipper/src/lib/shipper-shared-auth.mjs');
  const shipper = read('../web-shipper/src/server/shipper-auth.ts');
  const compose = read('../docker-compose.yml');
  assert.match(auth, /AUTH_HANDOFF_SECRET \|\| env\.AUTH_SESSION_SECRET/);
  assert.match(shipper, /verifySharedShipperToken/);
  assert.match(shipper, /roles!inner\(is_shipper\)/);
  assert.match(compose, /AUTH_HANDOFF_SECRET: \$\{AUTH_HANDOFF_SECRET:-\}/);
  assert.equal(existsSync(new URL('../scripts/setup-shipper-env.mjs', import.meta.url)), false);
  assert.doesNotMatch(compose, /SHIPPER_SESSION_SECRET/);
});
