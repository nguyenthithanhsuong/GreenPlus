import test from 'node:test';
import assert from 'node:assert/strict';
import {collectFailures} from '../scripts/testing/collect-failed-diagnostics.mjs';
test('diagnostic collector includes only non-passing gates and redacts known secrets',()=>{
  const report={groups:[{area:'05 Code architecture / performance',checks:[
    {check:'admin production build',status:'PASS',log:'pass.log'},
    {check:'shipper production build',status:'FAIL',detail:'exit 1',log:'shipper-production-build.log'},
    {check:'Python tests',status:'SKIPPED',detail:'Python missing'},
  ]}]};
  const text=collectFailures(report,name=>name==='shipper-production-build.log'?'ERROR secret@example.com Authorization: Bearer abcdefghijklmnop':'');
  assert.match(text,/shipper production build/);
  assert.match(text,/Python missing/);
  assert.ok(!text.includes('admin production build'));
  assert.ok(!text.includes('secret@example.com'));
  assert.ok(!text.includes('abcdefghijklmnop'));
});
test('log filename is validated against traversal',()=>{
  const report={groups:[{area:'x',checks:[{check:'x',status:'FAIL',log:'../../secrets.txt'}]}]};
  let visited=false;
  collectFailures(report,()=>{visited=true;return '';});
  assert.equal(visited,false);
});
