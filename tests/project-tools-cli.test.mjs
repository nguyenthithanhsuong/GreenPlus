import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const cli = resolve(root, 'scripts/project-tools.mjs');

test('root command surface stays small without breaking CI aliases', () => {
  assert.ok(Object.keys(pkg.scripts).length >= 24 && Object.keys(pkg.scripts).length <= 33,
    'Root commands must remain bounded while adding explicit migration safety tools');
  assert.equal(pkg.scripts.dev, 'node scripts/dev-with-docker.mjs');
  assert.equal(pkg.scripts['dev:all'], 'node scripts/dev-with-docker.mjs');
  assert.equal(pkg.scripts['dev:fast'], 'turbo dev --ui=stream');
  assert.equal(pkg.scripts.web, 'turbo dev --ui=tui');
  assert.ok(!('dev:apps' in pkg.scripts));
  for (const removed of ['clean:zip','test:client','test:release:static','maintain:restore']) assert.ok(!(removed in pkg.scripts));
  assert.doesNotMatch(pkg.scripts.dev, /concurrently|--ui=stream/);
  for (const key of ['check-all','test','audit:unused','docker:three-tier:up','docker:three-tier:check','zip:source','supabase:migrations:check','docker:three-tier:audit','docker:three-tier:stores']) {
    assert.equal(typeof pkg.scripts[key], 'string', `${key} must remain`);
  }
});

test('command router refuses unspecified/destructive defaults', () => {
  for (const args of [[], ['docker','reset'], ['mobile','client','publish'], ['maintain','delete-everything']]) {
    const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: root });
    assert.match(r.stdout + r.stderr, /GreenPlus project tools/);
    assert.equal(r.status, args.length ? 2 : 0);
  }
});

test('one router supplies Docker, PWA/TWA, and maintenance actions without shell interpolation', () => {
  const source = readFileSync(cli, 'utf8');
  assert.match(source, /three-tier-docker\.mjs/);
  assert.match(source, /mobile-release-check\.mjs/);
  assert.match(source, /mobile-twa\.mjs/);
  assert.match(source, /repo-maintenance\.mjs/);
  assert.match(source, /spawnSync\(process\.execPath,/);
  assert.doesNotMatch(source, /shell:\s*true|\beval\(/);
});
