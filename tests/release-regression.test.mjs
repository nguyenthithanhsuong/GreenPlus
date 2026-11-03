import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const getScript = (app, name) => JSON.parse(read(`${app}/package.json`)).scripts[name];

// Durable safeguards for issues previously tracked by four one-off CI #113–116 tests.
test('Supabase backfills allow a brand-new empty database but reject ambiguous legacy rows', () => {
  const backfill = read('supabase/migrations/0006_backfill_existing_store.sql');
  const diagnostics = read('supabase/migrations/0010_transition_diagnostics.sql');
  assert.match(backfill, /IF n = 1 THEN\s+RETURN;/);
  assert.match(backfill, /IF n > 1 THEN\s+RAISE EXCEPTION/);
  assert.match(backfill, /IF has_legacy_rows THEN\s+RAISE EXCEPTION/);
  assert.match(diagnostics, /IF store_count = 0 THEN/);
  assert.match(diagnostics, /IF has_rows THEN\s+RAISE EXCEPTION/);
  assert.match(diagnostics, /ELSIF store_count > 1 THEN/);
  for (const name of ['users', 'orders', 'products', 'inventory', 'deliveries']) {
    assert.ok(backfill.includes(`'${name}'`), `0006 must inspect ${name}`);
    assert.ok(diagnostics.includes(`'${name}'`), `0010 must inspect ${name}`);
  }
});

test('Shipper E2E isolates UI error feedback but independently tests real guest API denial', () => {
  const spec = read('web-shipper/e2e/shipper.spec.ts');
  const config = read('web-shipper/playwright.config.ts');
  assert.match(spec, /getByLabel\("Mật khẩu",\s*\{ exact: true \}\)/);
  assert.match(spec, /page\.addInitScript/);
  assert.match(spec, /new Response\(/);
  assert.match(spec, /returnedStatus: 401/);
  assert.match(spec, /__greenplusLoginFixture/);
  assert.doesNotMatch(spec, /page\.route\("\*\*\/api\/auth\/sign-in"/);
  assert.match(spec, /getByRole\("alert"\)\)\.toContainText/);
  assert.match(spec, /request\.get\("\/api\/shipper\/deliveries"\)/);
  assert.match(spec, /expect\(response\.status\(\)\)\.toBe\(401\)/);
  assert.match(config, /process\.env\.CI\s*\?\s*"npm run start"/);
  assert.match(config, /trace:\s*"retain-on-failure"/);
});

test('Shipper CI builds before Playwright and uploads diagnostics on failure', () => {
  const ci = read('.github/workflows/ci.yml');
  const frontend = ci.split('  frontend-ci:')[1]?.split('\n  backend-ci:')[0];
  assert.ok(frontend, 'frontend matrix must be present');
  for (const app of ['admin', 'client', 'shipper']) assert.match(frontend, new RegExp(`app:\\s*${app}\\b`));
  assert.ok(frontend.indexOf('name: Build') < frontend.indexOf('name: Shipper browser E2E tests'));
  assert.match(frontend, /SHIPPER_SESSION_SECRET:\s*ci-only-/);
  assert.match(frontend, /actions\/upload-artifact@v4/);
  assert.match(frontend, /if:\s*failure\(\)\s*&&\s*matrix\.app\s*==\s*'shipper'/);
  assert.match(ci, /needs:\s*\[pipeline-contracts, frontend-ci, backend-ci, docker-db-ci, supabase-db-ci, external-services-ci\]/);
});

test('Local dev ports and full Docker host ports match the user-selected mapping', () => {
  assert.match(getScript('web-admin', 'dev'), /-p 3000$/);
  assert.match(getScript('web-admin', 'dev:turbo'), /-p 3000$/);
  assert.match(getScript('web-client', 'dev'), /-p 3001$/);
  assert.match(getScript('web-client', 'dev:turbo'), /-p 3001$/);
  assert.match(getScript('web-shipper', 'dev'), /-p 3002$/);
  const compose = read('docker-compose.yml');
  assert.match(compose, /WEB_ADMIN_PORT:-3000\}:3001/);
  assert.match(compose, /WEB_CLIENT_PORT:-3001\}:3000/);
});

test('No database exports or server role build args reach Docker image context', () => {
  const ignore = read('.dockerignore');
  const gitignore = read('.gitignore');
  for (const path of ['backup_data.sql','backup_schema.sql','backups/']) assert.ok(gitignore.includes(path), `Missing gitignore: ${path}`);
  for (const path of ['backup_data.sql', 'backup_schema.sql', 'backups/', '.env*']) assert.ok(ignore.includes(path), `Missing dockerignore: ${path}`);
  const compose = read('docker-compose.yml');
  for (const section of compose.split(/\n\s+build:\s*\n/g).slice(1)) {
    const buildOnly = section.split(/\n\s+environment:/)[0];
    assert.doesNotMatch(buildOnly, /SUPABASE_SERVICE_ROLE_KEY:/);
  }
});

test('Unused Shipper-to-Admin proxy is removed; Shipper routes still own authentication', () => {
  assert.equal(existsSync(resolve(root, 'web-shipper/src/lib/shipper-auth-upstream.mjs')), false);
  assert.equal(existsSync(resolve(root, 'web-shipper/src/lib/shipper-auth-upstream.d.mts')), false);
  assert.equal(existsSync(resolve(root, 'web-shipper/src/lib/delivery-api.mjs')), false);
  assert.equal(existsSync(resolve(root, 'web-shipper/src/lib/delivery-api.d.mts')), false);
  const auth = read('web-shipper/src/app/api/auth/sign-in/route.ts');
  assert.match(auth, /signInShipper/);
  assert.doesNotMatch(auth, /authenticateWithAdmin/);
});
