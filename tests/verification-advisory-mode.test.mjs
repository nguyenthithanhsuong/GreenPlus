import test from 'node:test';
import assert from 'node:assert/strict';
import {parseOptions,createPlan,summarize,AREAS} from '../scripts/testing/verify-seven-areas.mjs';

test('local --skip-lint marks all three ESLint gates explicitly as advisory',()=>{
  const plan=createPlan(parseOptions(['--full','--skip-lint','--ai-serverless']));
  assert.equal(plan[4].checks.filter(x=>x.advisorySkip).length,3);
  assert.equal(plan[4].checks.filter(x=>x.advisorySkip&&x.label.includes('typecheck')).length,0);
  assert.equal(plan[4].checks.filter(x=>x.advisorySkip&&x.label.includes('build')).length,0);
});

test('lint-advisory only tags lint steps, keeps TS/build and dependency security mandatory',()=>{
  const plan=createPlan(parseOptions(['--full','--lint-advisory']));
  assert.deepEqual(plan[4].checks.filter(x=>x.advisory).map(x=>x.label),['admin ESLint','client ESLint','shipper ESLint']);
  assert.ok(!plan[7].checks.find(x=>x.label.includes('Runtime dependency advisory')).advisory);
  assert.equal(summarize([{area:AREAS[4],checks:[{status:'PASS'},{status:'ADVISORY'}]}])[0].status,'ADVISORY');
  assert.equal(summarize([{area:AREAS[4],checks:[{status:'FAIL'},{status:'ADVISORY'}]}])[0].status,'FAIL');
  assert.equal(summarize([{area:AREAS[4],checks:[{status:'SKIPPED'},{status:'ADVISORY'}]}])[0].status,'INCOMPLETE');
});

test('unknown flags still rejected',()=>assert.throws(()=>parseOptions(['--disable-security'])));

import {combineVerification,selectFailedSteps} from '../scripts/testing/verify-seven-areas.mjs';
test('rechecked failures merge into full report without claiming prior PASS was rerun',()=>{
  const base={generatedAt:'2026-11-22T00:00:00.000Z',groups:[
    {area:AREAS[0],checks:[{check:'AI contracts',status:'PASS'}]},
    {area:AREAS[4],checks:[{check:'admin ESLint',status:'FAIL'}, {check:'shipper production build',status:'FAIL'}]},
  ]};
  const retry={mode:'recheck',generatedAt:'2026-11-22T01:00:00.000Z',groups:[
    {area:AREAS[4],checks:[{check:'admin ESLint',status:'ADVISORY'},{check:'shipper production build',status:'PASS'}]},
  ]};
  const combined=combineVerification(base,retry);
  assert.equal(combined.groups[0].checks[0].evidence,'carried_forward');
  assert.equal(combined.groups[1].checks[1].evidence,'rechecked');
  assert.equal(combined.groups[1].checks[0].status,'ADVISORY');
  assert.equal(summarize(combined.groups)[1].status,'ADVISORY');
  const plan=createPlan(parseOptions(['--full','--skip-lint']));
  assert.deepEqual(selectFailedSteps(plan,combined),[]);
});

test('unexpected retry gate cannot silently enter merged report',()=>{
  const base={generatedAt:'t0',groups:[{area:AREAS[0],checks:[]}]};
  const retry={mode:'recheck',generatedAt:'t1',groups:[{area:AREAS[0],checks:[{check:'unverified',status:'PASS'}]}]};
  assert.throws(()=>combineVerification(base,retry),/Unexpected recheck gate/);
});
