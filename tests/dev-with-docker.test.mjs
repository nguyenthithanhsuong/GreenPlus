import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { devAllSteps } from '../scripts/dev-with-docker.mjs';
const root = resolve(import.meta.dirname, '..');

const files = opts => devAllSteps(opts).map(s => `${s.script} ${s.args.join(' ')}`);
test('dev:all always runs Supabase read-only safety gate before local Docker update', () => {
  assert.deepEqual(files().slice(0, 3), [
    'scripts/ci/dev-supabase-compatibility.mjs ',
    'scripts/three-tier-docker.mjs up',
    'scripts/three-tier-docker.mjs check',
  ]);
});
test('dev:all checks live tier inventory and warns when Docker is not full parity', () => {
  assert.deepEqual(files().slice(3), [
    'scripts/ci/three-tier-parity-audit.mjs ',
    'scripts/ci/three-tier-store-inventory.mjs ',
  ]);
  assert.match(files({ requireParity: true })[3], /--require-full-parity/);
});
test('optional Docker update bypass performs verification but no writes', () => {
  assert.equal(files({ dockerUpdate: false })[1], 'scripts/three-tier-docker.mjs check');
  assert.equal(files({ dockerUpdate: false }).filter(x => x.startsWith('scripts/three-tier-docker.mjs')).length, 1);
  assert.ok(files({dockerUpdate:false}).some(x=>x==='scripts/three-tier-full-schema.mjs --check'));
});
test('npm dev and dev:all converge; dev:web runs only web without recursion', () => {
  const scripts = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).scripts;
  assert.equal(scripts.dev, 'node scripts/dev-with-docker.mjs');
  assert.equal(scripts['dev:all'], 'node scripts/dev-with-docker.mjs');
  assert.equal(scripts['dev:web'], 'npm run dev:turbo');
  assert.equal(scripts['dev:turbo'], 'turbo dev --ui=tui');
  const wrapper = readFileSync(resolve(root, 'scripts/dev-with-docker.mjs'), 'utf8');
  assert.match(wrapper, /spawn\('npm run dev:turbo'/);
  assert.doesNotMatch(wrapper, /spawn\('npm run dev:all'/);
  assert.doesNotMatch(wrapper, /down.*(?:-v|--volumes)|supabase.*db.*push/);
  assert.match(wrapper, /connectLocalAdmin\(/);
});
