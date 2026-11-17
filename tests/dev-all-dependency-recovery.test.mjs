import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertDevAllFiles, devAllSteps } from '../scripts/dev-with-docker.mjs';

const root = resolve(import.meta.dirname, '..');
test('all dev:all dependencies from split migration patches are present', () => {
  assert.ok(assertDevAllFiles() >= 40);
  for (const step of devAllSteps()) assert.ok(existsSync(resolve(root, step.script)), `missing preflight ${step.script}`);
  for (const step of devAllSteps({dockerUpdate:false})) assert.ok(existsSync(resolve(root, step.script)), `missing read-only step ${step.script}`);
});

test('complete migration dependencies are pinned and do not run Supabase db push in dev:all', () => {
  const steps = devAllSteps().map(x => `${x.script} ${x.args.join(' ')}`);
  assert.match(steps[0], /dev-supabase-compatibility/);
  assert.equal(steps.filter(x => /db push|supabase db reset|down -v/.test(x)).length, 0);
});
