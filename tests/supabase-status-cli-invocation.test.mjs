import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, delimiter } from 'node:path';
import { spawnSync } from 'node:child_process';
import { inventoryMigrations } from '../scripts/ci/migration-safety.mjs';
import { invokeSupabaseCli } from '../scripts/ci/supabase-cli-process.mjs';

const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Supabase status uses npm-scoped CLI without requiring a global executable', () => {
  assert.equal(
    scripts['supabase:migrations:status'],
    'npm exec --yes --package=supabase@3.2.0 -- node scripts/ci/supabase-migration-gate.mjs --report',
  );
});

test('Supabase migration status remains read-only and deployment gates are unchanged', () => {
  assert.equal(scripts['supabase:migrations:check'], 'node scripts/ci/supabase-migration-gate.mjs --static');
  assert.ok(!/\b(?:--apply|push|repair|reset)\b/.test(scripts['supabase:migrations:status']));
  const gate = readFileSync(new URL('../scripts/ci/supabase-migration-gate.mjs', import.meta.url), 'utf8');
  assert.match(gate, /invokeSupabaseCli\(argv\)/);
  assert.match(gate, /GREENPLUS_SUPABASE_AUTODEPLOY/);
});

test('the status gate accepts a real-looking Supabase v3 Markdown table end-to-end', () => {
  const root = resolve(import.meta.dirname, '..');
  const dir = mkdtempSync(join(tmpdir(), 'gp-supabase-v3-report-'));
  try {
    const rows = inventoryMigrations();
    const listing = `Target: project greenplus (production)\nInitialising login role...\n\n` +
      `   Local  | Remote | Time (UTC)\n  --------|--------|------------\n` +
      rows.map(r => `   \`${r.version}\` | \`${r.version}\` | \`${r.version}\``).join('\n');
    const fixture = join(dir, 'cloud-listing.txt');
    writeFileSync(fixture, listing);
    const run = spawnSync(process.execPath,
      ['scripts/ci/supabase-migration-gate.mjs', '--report', '--list-file', fixture],
      { cwd: root, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /Remote migration versions: 23\/23 applied; 0 pending: none/);
    assert.match(run.stdout, /PASS: local and remote migration version lists match/);
    assert.doesNotMatch(run.stdout + run.stderr, /Applying|Pushing|db push/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Windows invokes only the fixed CLI command via npm PATH without unescaped argv', () => {
  let call;
  const result = invokeSupabaseCli(['migration', 'list', '--linked'], {
    platform: 'win32', cwd: 'C:\\greenplus', exists: () => false,
    spawn: (...args) => { call = args; return { status: 0, stdout: 'Local | Remote\n`0023` | `0023`', stderr: '' }; },
  });
  assert.equal(result.status, 0);
  assert.equal(call.length, 2); // no separate arguments array; avoids DEP0190
  assert.equal(call[0], 'supabase migration list --linked');
  assert.equal(call[1].shell, true);
  assert.equal(call[1].windowsHide, true);
});

test('Windows uses npm PATH even if a local .cmd shim exists', () => {
  let call;
  invokeSupabaseCli(['migration', 'list', '--linked'], {
    platform: 'win32', cwd: 'C:\\greenplus', exists: () => true,
    spawn: (...args) => { call = args; return { status: 0, stdout: '', stderr: '' }; },
  });
  assert.equal(call[0], 'supabase migration list --linked');
  assert.equal(call.length, 2);
});

test('Windows shell allowlist rejects dynamic or potentially injectable CLI arguments', () => {
  let called = false;
  assert.throws(() => invokeSupabaseCli(['migration', 'list', '--linked', '&', 'whoami'], {
    platform: 'win32', spawn: () => { called = true; },
  }), /refused before invoking shell/);
  assert.equal(called, false);
  for (const args of [
    ['db','push','--linked','--dry-run'],
    ['db','push','--linked','--yes'],
  ]) {
    let invoked;
    invokeSupabaseCli(args, {
      platform:'win32',
      spawn: (...input) => { invoked = input; return {status:0,stdout:'',stderr:''}; },
    });
    assert.equal(invoked.length, 2);
    assert.equal(invoked[0], `supabase ${args.join(' ')}`);
  }
});

test('Linux invokes native CLI without a shell to preserve CI behavior', () => {
  let call;
  invokeSupabaseCli(['migration', 'list', '--linked'], {
    platform: 'linux',
    cwd: '/tmp/greenplus',
    exists: () => false,
    spawn: (command, args, options) => { call = { command, args, options }; return { status: 0, stdout: '', stderr: '' }; },
  });
  assert.equal(call.command, 'supabase');
  assert.equal(call.options.shell, false);
});


test('read-only status accepts an npm-style PATH executable end-to-end on Unix', { skip: process.platform === 'win32' }, () => {
  const root = resolve(import.meta.dirname, '..');
  const dir = mkdtempSync(join(tmpdir(), 'gp-supabase-path-'));
  try {
    const bin = join(dir, 'bin');
    mkdirSync(bin);
    const rows = inventoryMigrations();
    const listing = 'Local | Remote | Time (UTC)\n' + rows.map(r => `${r.version} | ${r.version} | ${r.version}`).join('\n');
    const shim = join(bin, 'supabase');
    writeFileSync(shim, `#!/usr/bin/env node\nconsole.log(${JSON.stringify(listing)});\n`);
    chmodSync(shim, 0o755);
    const result = spawnSync(process.execPath, ['scripts/ci/supabase-migration-gate.mjs', '--report'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ''}` },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Remote migration versions: 23\/23 applied; 0 pending: none/);
    assert.match(result.stdout, /PASS: local and remote migration version lists match/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
