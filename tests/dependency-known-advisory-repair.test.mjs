import test from 'node:test';
import assert from 'node:assert/strict';
import {TARGET,versionLessThan,vulnerableEntries,updatedRootManifest} from '../scripts/ci/repair-known-npm-advisory.mjs';
test('advisory repair identifies vulnerable lock entry but not unaffected packages',()=>{
  assert.equal(TARGET,'1.16.3');
  const doc={packages:{'node_modules/follow-redirects':{version:'1.16.1'},'node_modules/foo':{version:'1.0.0'}}};
  assert.equal(vulnerableEntries(doc).length,1);
  assert.equal(versionLessThan('1.16.2',TARGET),true);
  assert.equal(versionLessThan('1.16.3',TARGET),false);
});
test('root overrides preserves existing Next.js pin and does not mutate input',()=>{
  const original={name:'greenplus',overrides:{next:'16.4.6'}};
  const result=updatedRootManifest(original);
  assert.deepEqual(result.overrides,{next:'16.4.6','follow-redirects':'1.16.3'});
  assert.deepEqual(original.overrides,{next:'16.4.6'});
});
