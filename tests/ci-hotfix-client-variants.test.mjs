import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { clientTestFix } from '../scripts/apply-greenplus-ci-fixes-20261101.mjs';

const wrapper = '`(function(module, exports, require) { })`';

test('renames original helper without changing VM parameter', () => {
  const input = `function loadTs() {\n  const module = { exports: {} };\n vm.runInNewContext(${wrapper})(module, module.exports);\n return module.exports;\n}`;
  const result = clientTestFix(input);
  assert.equal(result.changed, true);
  assert.match(result.text, /const testModule =/);
  assert.match(result.text, /\(testModule, testModule\.exports\)/);
  assert.match(result.text, /return testModule\.exports/);
  assert.match(result.text, /\(function\(module, exports, require\)/);
  assert.equal(clientTestFix(result.text).changed, false);
});

test('accepts spacing/no-semicolon variant', () => {
  const input = `let module={exports:{}}\n  vm.runInNewContext(${wrapper})(module,  module . exports);\n  return module.exports`;
  const result = clientTestFix(input);
  assert.equal(result.changed, true);
  assert.match(result.text, /let testModule=/);
  assert.match(result.text, /testModule, testModule\.exports/);
});

test('already renamed or different helper is safe no-op', () => {
  for (const source of [
    'const testModule = { exports: {} }; return testModule.exports;',
    'const cjsModule = { exports: {} }; return cjsModule.exports;',
    'test("one", () => assert.equal(1, 1));',
  ]) {
    assert.deepEqual(clientTestFix(source), { text: source, changed: false });
  }
});

test('refuses unexpected module declarations instead of changing unfamiliar code', () => {
  assert.throws(() => clientTestFix('const module = calculateSomething();'), /unexpected local module declaration/);
});
