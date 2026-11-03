import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const repairPath = join(root, 'scripts/repair-three-tier-commerce.mjs');
const repair = readFileSync(repairPath, 'utf8');
const wrapper = readFileSync(join(root, 'scripts/three-tier-docker.mjs'), 'utf8');

// Use Node's preload mechanism to intercept ONLY Docker commands in the child
// under test. A fake executable named "docker" on PATH is not portable to
// Windows: spawnSync can select the real docker.exe rather than a shell stub.
// This fixture does not require a Docker daemon or mutate local volumes.
const dockerPreload = `
const cp = require('node:child_process');
const fs = require('node:fs');
const { syncBuiltinESMExports } = require('node:module');
const originalSpawn = cp.spawnSync;
cp.spawnSync = function(command, args, options) {
  if (command !== 'docker') return originalSpawn.call(this, command, args, options);
  fs.appendFileSync(process.env.GREENPLUS_TEST_DOCKER_TRACE, JSON.stringify(args) + '\\n');
  if (process.env.GREENPLUS_TEST_DOCKER_MODE === 'missing') {
    return { status: 0, stdout: 'public.demo_restock(uuid,uuid,integer)\\n', stderr: '' };
  }
  if (process.env.GREENPLUS_TEST_DOCKER_MODE === 'transport-error') {
    return { status: 43, stdout: '', stderr: 'mock transport failure\\n' };
  }
  return { status: 0, stdout: '', stderr: '' };
};
syncBuiltinESMExports();
`;

function runIsolatedCheck(mode) {
  const dir = mkdtempSync(join(tmpdir(), 'greenplus-repair-test-'));
  try {
    const preload = join(dir, 'mock-docker.cjs');
    const trace = join(dir, 'docker-commands.jsonl');
    writeFileSync(preload, dockerPreload);
    writeFileSync(trace, '');
    const result = spawnSync(process.execPath, ['--require', preload, repairPath, '--check'], {
      cwd: root,
      env: {
        ...process.env,
        GREENPLUS_TEST_DOCKER_MODE: mode,
        GREENPLUS_TEST_DOCKER_TRACE: trace,
      },
      encoding: 'utf8',
      timeout: 15000,
      windowsHide: true,
    });
    if (result.error) throw result.error;
    const commands = readFileSync(trace, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
    return { ...result, commands };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('repair runs 003 before 004 on all 3 databases, checks five scopes, and never touches volume data', () => {
  assert.match(repair, /\['003_inventory_orders\.sql','004_payment_delivery_simulation\.sql'\]/);
  for (const item of ['shared-db', 'enterprise-a-db', 'enterprise-b-db', 'pro_a', 'pro_b']) assert.ok(repair.includes(item));
  for (const item of ['demo_restock', 'demo_checkout', 'demo_cancel_order', 'demo_confirm_payment', 'demo_assign_delivery', 'demo_complete_delivery']) assert.ok(repair.includes(item));
  assert.doesNotMatch(repair, /\b(?:down\s+-v|volume\s+rm|DROP\s+(?:TABLE|SCHEMA|DATABASE))\b/i);
});

test('docker up verifies after SQL while docker check remains non-mutating', () => {
  assert.match(wrapper, /repair-three-tier-commerce\.mjs'\)\]/);
  assert.match(wrapper, /repair-three-tier-commerce\.mjs'\), '--check'/);
  assert.match(wrapper, /if \(migration\.status !== 0\) throw/);
});

test('read-only RPC verification reports the exact missing signature without starting real Docker', () => {
  const result = runIsolatedCheck('missing');
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /missing RPCs: public\.demo_restock\(uuid,uuid,integer\)/);
  assert.equal(result.commands.length, 1, 'fail at the first missing RPC, rather than silently continuing');
  const args = result.commands[0];
  assert.deepEqual(args.slice(0, 3), ['compose', '--project-directory', join(root, 'docker/three-tier')]);
  assert.ok(args.includes('shared-db'));
  assert.ok(args.includes('psql'));
  const sql = args[args.indexOf('-c') + 1];
  assert.match(sql, /^SELECT signature FROM \(VALUES /);
  for (const fn of ['demo_restock', 'demo_checkout', 'demo_cancel_order', 'demo_confirm_payment', 'demo_assign_delivery', 'demo_complete_delivery']) {
    assert.ok(sql.includes(`public.${fn}`), `missing ${fn} from check SQL`);
  }
  assert.match(sql, /to_regprocedure/);
});

test('read-only RPC verification checks all five tenant scopes when signatures exist', () => {
  const result = runIsolatedCheck('success');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.commands.length, 5, 'shared public, Pro A/B, Enterprise A/B');
  assert.equal((result.stdout.match(/commerce RPC signatures present/g) || []).length, 5);
  for (const args of result.commands) {
    assert.ok(args.includes('psql'));
    const sql = args[args.indexOf('-c') + 1];
    assert.match(sql, /^SELECT signature FROM \(VALUES /);
    assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP)\b/i);
  }
});

test('read-only RPC verification distinguishes Docker errors from missing migrations', () => {
  const result = runIsolatedCheck('transport-error');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Docker command failed \(exit 43\)/);
  assert.match(result.stderr, /mock transport failure/);
  assert.doesNotMatch(result.stderr, /missing RPCs:/);
  assert.equal(result.commands.length, 1);
});
