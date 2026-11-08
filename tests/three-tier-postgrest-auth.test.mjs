import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ensureDockerSecrets } from '../scripts/three-tier-secrets.mjs';
const root = resolve(import.meta.dirname, '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const token = 'Z'.repeat(64);

function withIsolatedEnv(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'greenplus-docker-auth-'));
  const file = join(dir, '.env');
  try { return fn(file); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('fresh Docker lab generates three distinct credentials and never prints them', () => {
  withIsolatedEnv((file) => {
    const result = ensureDockerSecrets(file);
    assert.deepEqual(result, { created: true, addedRestPassword: true });
    const data = readFileSync(file, 'utf8');
    const lines = Object.fromEntries(data.split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => line.split('=')));
    assert.equal(Object.keys(lines).length, 3);
    for (const value of Object.values(lines)) assert.match(value, /^[a-f0-9]{72}$/);
    assert.equal(new Set(Object.values(lines)).size, 3);
    assert.deepEqual(ensureDockerSecrets(file), { created: false, addedRestPassword: false });
    assert.equal(readFileSync(file, 'utf8'), data, 'never regenerate credentials on restart');
  });
});

test('existing Docker volumes keep PostgreSQL and gateway keys unchanged', () => {
  withIsolatedEnv((file) => {
    const original = `# existing deployment\nDEMO_POSTGRES_PASSWORD=${'P'.repeat(64)}\nDEMO_GATEWAY_KEY=${'G'.repeat(64)}\n`;
    writeFileSync(file, original);
    const result = ensureDockerSecrets(file, () => token);
    assert.deepEqual(result, { created: false, addedRestPassword: true });
    assert.equal(readFileSync(file,'utf8'), original + `DEMO_POSTGREST_PASSWORD=${token}\n`);
    assert.deepEqual(ensureDockerSecrets(file), { created: false, addedRestPassword: false });
  });
});

test('placeholder, duplicated, and unsafe existing credentials are rejected without mutation', () => {
  withIsolatedEnv((file) => {
    for (const data of [
      'DEMO_POSTGRES_PASSWORD=replace-with-a-password\nDEMO_GATEWAY_KEY=good\n',
      `DEMO_POSTGRES_PASSWORD=valid\nDEMO_POSTGRES_PASSWORD=duplicate\nDEMO_GATEWAY_KEY=valid\n`,
      `DEMO_POSTGRES_PASSWORD=valid\nDEMO_GATEWAY_KEY=valid\nDEMO_POSTGREST_PASSWORD=unsafe@url\n`,
      `DEMO_POSTGRES_PASSWORD=valid\nDEMO_GATEWAY_KEY=valid\nDEMO_POSTGREST_PASSWORD=\n`,
    ]) {
      writeFileSync(file,data);
      assert.throws(() => ensureDockerSecrets(file), /placeholder|duplicated|URL-safe/);
      assert.equal(readFileSync(file,'utf8'),data);
    }
  });
});

test('all three PostgREST services use dedicated, non-superuser login after one-shot setup', () => {
  const c=read('docker/three-tier/compose.yaml');
  const sql=read('docker/three-tier/sql/auth/005_postgrest_authenticator.sql');
  for (const tier of ['shared', 'enterprise-a', 'enterprise-b']) {
    assert.match(c, new RegExp(`  ${tier}-rest-auth:`));
    assert.match(c, new RegExp(`${tier}-rest-auth: \\{ condition: service_completed_successfully \\}`));
    assert.match(c, new RegExp(`PGRST_DB_URI: postgresql://greenplus_postgrest:\\$\\{DEMO_POSTGREST_PASSWORD:`));
  }
  assert.doesNotMatch(c, /PGRST_DB_URI:\s*postgresql:\/\/postgres:/);
  // A scalar `command: >-` would be tokenized, so `/bin/sh -ec` runs only
  // `psql` without its -h/-U/-d/-f flags. Guard the list form on all tiers.
  for (const tier of ['shared', 'enterprise-a', 'enterprise-b']) {
    const block = c.split(`  ${tier}-rest-auth:\n`)[1]?.split(/\n  [a-z][\w-]*:\n/)[0] ?? '';
    assert.match(block, /entrypoint: \["\/bin\/sh", "-ec"\]/);
    assert.match(block, /command:\n      - >-\n        exec psql -q -h /);
  }
  assert.match(sql, /CREATE ROLE greenplus_postgrest LOGIN NOINHERIT NOSUPERUSER/);
  assert.match(sql, /ALTER ROLE greenplus_postgrest LOGIN NOINHERIT NOSUPERUSER/);
  assert.match(sql, /GRANT web_anon TO greenplus_postgrest/);
  assert.match(sql, /NOBYPASSRLS/);
  assert.match(read('scripts/three-tier-docker.mjs'), /rolbypassrls/);
  assert.doesNotMatch(sql, /\b(?:DROP TABLE|TRUNCATE|DELETE FROM|DROP DATABASE|DROP SCHEMA)\b/i);
  const wrapper=read('scripts/three-tier-docker.mjs');
  assert.match(wrapper,/verifyPostgrestRole\(\)/);
  assert.equal(wrapper.match(/verifyPostgrestRole\(\);/g)?.length,2,'role is verified in both up and check');
});
