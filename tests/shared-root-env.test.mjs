import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { readAssignments, planUnification, applyUnification } from '../scripts/unify-web-env.mjs';

const root = resolve(import.meta.dirname, '..');
const fixture = () => {
  const path = mkdtempSync(resolve(tmpdir(), 'greenplus-root-env-'));
  for (const app of ['web-admin', 'web-client', 'web-shipper']) mkdirSync(resolve(path, app));
  return path;
};

test('all three Next apps load root .env.local before root .env; no app-specific dotenv reference', () => {
  for (const app of ['web-admin', 'web-client', 'web-shipper']) {
    const config = readFileSync(resolve(root, app, 'next.config.ts'), 'utf8');
    const local = config.indexOf('loadEnv({ path: resolve(process.cwd(), "../.env.local") });');
    const fallback = config.indexOf('loadEnv({ path: resolve(process.cwd(), "../.env") });');
    assert.ok(local >= 0 && fallback > local, `${app} missing shared-env priority`);
    assert.doesNotMatch(config, /resolve\(process\.cwd\(\), "\.env\.local"\)/);
    assert.doesNotMatch(config, /override:\s*true/);
    assert.doesNotMatch(config, /NEXT_PUBLIC_.*SERVICE_KEY/);
  }
});

test('Docker gateway connector now writes only root .env.local', () => {
  const script = readFileSync(resolve(root, 'scripts/three-tier-connect-admin.mjs'), 'utf8');
  assert.match(script, /ADMIN_ENV_PATH = '\.env\.local'/);
  assert.doesNotMatch(script, /ADMIN_ENV_PATH = 'web-admin\//);
});

test('planning is read only and applying merges distinct keys, backing up old files', () => {
  const dir = fixture();
  try {
    writeFileSync(resolve(dir, '.env.local'), 'GREENPLUS_AI_SERVICE_URL=http://127.0.0.1:8100\n');
    writeFileSync(resolve(dir, 'web-admin/.env.local'), 'AUTH_HANDOFF_SECRET=secret\n');
    writeFileSync(resolve(dir, 'web-client/.env.local'), 'NEXT_PUBLIC_SAMPLE=test\n');
    writeFileSync(resolve(dir, 'web-shipper/.env.local'), 'AUTH_HANDOFF_SECRET=secret\n');
    const plan = planUnification(dir);
    assert.equal(plan.sources.length, 3);
    assert.equal(plan.added.length, 2);
    assert.deepEqual(plan.conflicts, []);
    assert.equal(existsSync(resolve(dir, 'web-admin/.env.local')), true);
    assert.deepEqual(applyUnification(dir), { moved: 3, added: 2 });
    const merged = readFileSync(resolve(dir, '.env.local'), 'utf8');
    assert.equal(readAssignments(merged, '.env.local').get('AUTH_HANDOFF_SECRET').value, 'secret');
    assert.equal(readAssignments(merged, '.env.local').get('NEXT_PUBLIC_SAMPLE').value, 'test');
    for (const app of ['web-admin', 'web-client', 'web-shipper']) {
      assert.equal(existsSync(resolve(dir, `${app}/.env.local`)), false);
      assert.equal(existsSync(resolve(dir, `${app}/.env.local.greenplus-migrated.bak`)), true);
    }
    assert.deepEqual(applyUnification(dir), { moved: 0, added: 0 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('conflicting key values across apps or root are blocked without changing files', () => {
  const dir = fixture();
  try {
    writeFileSync(resolve(dir, '.env.local'), 'AUTH_HANDOFF_SECRET=one\n');
    writeFileSync(resolve(dir, 'web-admin/.env.local'), 'AUTH_HANDOFF_SECRET=two\n');
    const plan = planUnification(dir);
    assert.deepEqual(plan.conflicts, ['AUTH_HANDOFF_SECRET']);
    assert.throws(() => applyUnification(dir), /Conflicting key names/);
    assert.equal(readFileSync(resolve(dir, '.env.local'), 'utf8'), 'AUTH_HANDOFF_SECRET=one\n');
    assert.equal(existsSync(resolve(dir, 'web-admin/.env.local')), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('unsupported syntax or backup collisions fail safely', () => {
  const dir = fixture();
  try {
    writeFileSync(resolve(dir, 'web-admin/.env.local'), 'BAD_MALFORMED_LINE\n');
    assert.throws(() => planUnification(dir), /Unsupported dotenv syntax/);
    writeFileSync(resolve(dir, 'web-admin/.env.local'), 'AUTH_HANDOFF_SECRET=one\n');
    writeFileSync(resolve(dir, 'web-admin/.env.local.greenplus-migrated.bak'), 'old-backup');
    assert.throws(() => applyUnification(dir), /Backup already exists/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
