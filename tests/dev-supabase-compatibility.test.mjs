import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { remoteCheckDecision } from '../scripts/ci/dev-supabase-compatibility.mjs';
import { inventoryMigrations, inspectRemoteMigrations, planRemoteMigrations } from '../scripts/ci/migration-safety.mjs';
const root = resolve(import.meta.dirname, '..');
const rows = inventoryMigrations();
const listing = count => `LOCAL | REMOTE | UTC\n${rows.map((r, i) => `${r.version} | ${i < count ? r.version : ''} | date`).join('\n')}`;

test('Supabase remote preflight defaults to read-only conditional check; strict mode fails without link', () => {
  assert.deepEqual(remoteCheckDecision({}), { run: false, fatal: false, reason: 'Supabase project not linked (supabase/.temp/project-ref missing)' });
  assert.equal(remoteCheckDecision({ mode: 'required' }).fatal, true);
  assert.equal(remoteCheckDecision({ mode: 'off', linked: true, cliAvailable: true }).run, false);
  assert.equal(remoteCheckDecision({ linked: true, cliAvailable: true }).run, true);
  assert.throws(() => remoteCheckDecision({ mode: 'unsafe' }), /must be auto, off or required/);
});
test('Remote is NOT reported up-to-date when SQL 0019 is pending manual approval', () => {
  const state = inspectRemoteMigrations(rows, listing(18));
  assert.equal(state.applied, 18);
  assert.equal(state.upToDate, false);
  assert.deepEqual(state.pending, ['0019_rbac_audit_foundation.sql']);
  assert.equal(state.pendingManual.length, 1);
  assert.throws(() => planRemoteMigrations(rows, listing(18)), /manual deployment/);
  assert.equal(inspectRemoteMigrations(rows, listing(19)).upToDate, true);
  assert.throws(() => inspectRemoteMigrations(rows, 'LOCAL | REMOTE\n0001 | 9999'), /diverges/);
});
test('Supabase CLI --report fixture stays read-only and --require-up-to-date blocks missing migration', () => {
  const dir = mkdtempSync(join(tmpdir(), 'greenplus-preflight-'));
  try {
    const path = join(dir, 'remote-list.txt');
    writeFileSync(path, listing(18));
    const gate = resolve(root, 'scripts/ci/supabase-migration-gate.mjs');
    const report = spawnSync(process.execPath, [gate, '--report', '--list-file', path], { cwd: root, encoding: 'utf8' });
    assert.equal(report.status, 0, report.stderr);
    assert.match(report.stdout, /MANUAL REVIEW required: 0019/);
    assert.match(report.stdout, /No remote writes performed/);
    const strict = spawnSync(process.execPath, [gate, '--require-up-to-date', '--list-file', path], { cwd: root, encoding: 'utf8' });
    assert.equal(strict.status, 1);
    assert.match(strict.stderr, /missing local migrations/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('Supabase dev checker without local link succeeds but NEVER claims remote compatibility', () => {
  const script = resolve(root, 'scripts/ci/dev-supabase-compatibility.mjs');
  const env = { ...process.env, GREENPLUS_DEV_SUPABASE_REMOTE_CHECK: 'off', GREENPLUS_DEV_SUPABASE_STORAGE_LIVE: 'false' };
  const report = spawnSync(process.execPath, [script], { cwd: root, env, encoding: 'utf8' });
  assert.equal(report.status, 0, report.stderr);
  assert.match(report.stdout + report.stderr, /cloud migration compatibility NOT VERIFIED/);
  const strict = spawnSync(process.execPath, [script, '--require-remote'], { cwd: root, env, encoding: 'utf8' });
  assert.equal(strict.status, 1);
});
