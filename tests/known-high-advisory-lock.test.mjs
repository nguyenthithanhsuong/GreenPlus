import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));

const patched = {
  'follow-redirects': {
    version: '1.16.3',
    integrity: 'sha512-toOSoqN6d51Wjf1aOFJYcoVv1aND9rj/CwjLU0Vz40oDuSpWDayCeKe4JpL5NL0WdFvoOOCI3BRo69HahjbR1A==',
  },
  'source-map-js': {
    version: '1.2.2',
    integrity: 'sha512-KGj/8Y43x35aZVDtt+J4mK1hoLGHULMYfSkODJNQjNDC3oW1PqPoxMwo0pLUsWM/UEGzON/NxeHywEfNXNP3Vw==',
  },
};

for (const [name, expected] of Object.entries(patched)) {
  test(`${name} has a patched lockfile version, registry URL and SRI`, () => {
    assert.equal(packageJson.overrides?.[name], expected.version);
    const entry = lock.packages?.[`node_modules/${name}`];
    assert.equal(entry?.version, expected.version);
    assert.equal(entry?.resolved, `https://registry.npmjs.org/${name}/-/${name}-${expected.version}.tgz`);
    assert.equal(entry?.integrity, expected.integrity);
    assert.equal(Buffer.from(entry.integrity.slice('sha512-'.length), 'base64').length, 64);
  });
}

test('package-lock root remains synchronized with workspaces and root dependencies', () => {
  assert.equal(lock.lockfileVersion, 3);
  assert.deepEqual(lock.packages[''].workspaces, packageJson.workspaces);
  assert.deepEqual(lock.packages[''].dependencies, packageJson.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, packageJson.devDependencies);
});
