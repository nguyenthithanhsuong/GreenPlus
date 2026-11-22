import test from 'node:test';
import assert from 'node:assert/strict';
import {parseOptions,createPlan,summarize,saveReport,AREAS} from '../scripts/testing/verify-seven-areas.mjs';
import {parseOptions as parseAcceptanceOptions,createPlan as createAcceptancePlan} from '../scripts/testing/acceptance-runner.mjs';

function aiCheckPlan(options) { return createPlan(options)[0].checks; }

test('explicit serverless verification has Node AI checks and no Python executable',()=>{
  const options=parseOptions(['--full','--strict','--ai-serverless']);
  assert.equal(options.ai_serverless,true);
  const checks=aiCheckPlan(options);
  assert.ok(checks.some(c=>c.label==='Serverless AI runtime tests' && c.cmd===process.execPath));
  const fastapi=checks.find(c=>c.label==='FastAPI AI unit tests');
  assert.equal(fastapi.applicable,false);
  assert.match(fastapi.reason,/NOT APPLICABLE/i);
  assert.ok(!checks.some(c=>['python','python3','py'].includes(c.cmd)));
});

test('serverless environment uses Node path even without explicit flag',()=>{
  const previous=process.env.GREENPLUS_AI_RUNTIME;
  try{
    process.env.GREENPLUS_AI_RUNTIME='serverless';
    const checks=aiCheckPlan(parseOptions(['--strict']));
    assert.equal(checks.find(c=>c.label==='FastAPI AI unit tests').applicable,false);
  }finally{
    if(previous===undefined)delete process.env.GREENPLUS_AI_RUNTIME;
    else process.env.GREENPLUS_AI_RUNTIME=previous;
  }
});

test('FastAPI remains testable for projects that explicitly select it',()=>{
  const previous=process.env.GREENPLUS_AI_RUNTIME;
  try{
    delete process.env.GREENPLUS_AI_RUNTIME;
    const checks=aiCheckPlan(parseOptions([]));
    const fastapi=checks.find(c=>c.label==='FastAPI AI unit tests');
    assert.notEqual(fastapi.applicable,false);
  }finally{
    if(previous!==undefined)process.env.GREENPLUS_AI_RUNTIME=previous;
  }
});

test('NOT_APPLICABLE is not PASS, does not mask FAIL or SKIPPED in summary',()=>{
  const group=area=>({area,checks:[{status:'PASS'},{status:'NOT_APPLICABLE'}]});
  const status=summarize([group(AREAS[0])])[0];
  assert.equal(status.pass,1);
  assert.equal(status.na,1);
  assert.equal(status.status,'PASS');
  assert.equal(summarize([{area:'x',checks:[{status:'NOT_APPLICABLE'},{status:'FAIL'}]}])[0].status,'FAIL');
  assert.equal(summarize([{area:'x',checks:[{status:'NOT_APPLICABLE'},{status:'SKIPPED'}]}])[0].status,'INCOMPLETE');
});

test('acceptance runner documents optional Node-only AI mode',()=>{
  assert.equal(parseAcceptanceOptions(['--full','--ai-serverless']).aiServerless,true);
  assert.ok(createAcceptancePlan(parseAcceptanceOptions(['--ai-serverless'])).length>=7);
  assert.throws(()=>parseAcceptanceOptions(['--drop-guard']));
});
