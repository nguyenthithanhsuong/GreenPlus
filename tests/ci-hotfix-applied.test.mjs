import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepare } from '../scripts/apply-greenplus-ci-fixes-20261101.mjs';

test('GreenPlus CI repair is applied once and remains repeatable', () => {
  const files = prepare(process.cwd());
  assert.deepEqual(files.filter((file) => file.changed).map((file) => file.path), []);
});
