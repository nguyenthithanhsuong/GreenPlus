import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dockerStartStrategy } from '../scripts/dev-with-docker.mjs';
const root = resolve(import.meta.dirname, '..');

test('running gateway does not rebuild or migrate', () => {
  assert.equal(dockerStartStrategy({ ready: true, hasGatewayContainer: true }), 'reuse');
});
test('stopped gateway reuses existing volumes and image', () => {
  assert.equal(dockerStartStrategy({ ready: false, hasGatewayContainer: true }), 'resume');
});
test('new Docker sandbox bootstraps only on first use', () => {
  assert.equal(dockerStartStrategy({ ready: false, hasGatewayContainer: false }), 'bootstrap');
});
test('npm dev starts Docker wrapper; dev:web retains web workflow; terminal retains Turbo TUI', () => {
  const scripts = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).scripts;
  assert.equal(scripts.dev, 'node scripts/dev-with-docker.mjs');
  assert.equal(scripts['dev:web'], 'npm run dev:all');
  assert.equal(scripts['dev:turbo'], 'turbo dev --ui=tui');
  const wrapper = readFileSync(resolve(root, 'scripts/dev-with-docker.mjs'), 'utf8');
  assert.match(wrapper, /spawn\('npm run dev:turbo'/);
  assert.doesNotMatch(wrapper, /spawn\('npm run dev:all'/);
});
test('unrelated process on port 4100 is not trusted as our gateway', () => {
  assert.equal(dockerStartStrategy({ ready: true, hasGatewayContainer: false }), 'bootstrap');
});
