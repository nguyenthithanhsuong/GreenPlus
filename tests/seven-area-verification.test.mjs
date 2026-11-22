import test from 'node:test';
import assert from 'node:assert/strict';
import {AREAS,parseOptions,createPlan,summarize,redact,detectPython,selectFailedSteps,diagnoseFailure} from '../scripts/testing/verify-seven-areas.mjs';
import {parseBadging,parseSignatures,validateResults} from '../scripts/testing/verify-android-apk.mjs';

test('exactly seven product groups plus independent CI/CD gate',()=>{
  const options=parseOptions([]),plan=createPlan(options);
  assert.equal(AREAS.length,8);
  assert.equal(plan.length,8);
  assert.ok(plan.every(group=>group.checks.length>0));
  assert.ok(plan.flatMap(g=>g.checks).every(c=>!c.args.join(' ').includes('down --volumes')&&!c.args.includes('migrate')));
});
test('full mode adds 9 quality gates, requires real dependencies',()=>{
  const options=parseOptions(['--full']);const plan=createPlan(options);
  assert.equal(plan[4].checks.filter(s=>s.label.includes('production build')).length,3);
  assert.equal(plan[4].checks.filter(s=>s.label.includes('ESLint')).length,3);
  assert.equal(plan[4].checks.filter(s=>s.label.includes('typecheck')).length,3);
});
test('staging/android gated by explicit opt-in and no hardcoded host',()=>{
  const basic=createPlan(parseOptions([]));
  assert.ok(!basic.flatMap(g=>g.checks).some(c=>c.label.includes('signed APK')||c.label.includes('hosted applications')));
  const opt=createPlan(parseOptions(['--staging','--android']));
  assert.equal(opt[1].checks.filter(c=>c.label.includes('signed APK')).length,2);
  assert.equal(opt[7].checks.filter(c=>c.label.includes('hosted applications')).length,1);
  assert.throws(()=>parseOptions(['--delete-data']));
});
test('status is INCOMPLETE for missing prerequisite, FAIL for executable failure',()=>{
  assert.deepEqual(summarize([{area:'x',checks:[{status:'PASS'},{status:'SKIPPED'}]}])[0].status,'INCOMPLETE');
  assert.equal(summarize([{area:'x',checks:[{status:'PASS'},{status:'FAIL'}]}])[0].status,'FAIL');
});
test('external report truncation redacts email, bearer and tokens',()=>{
  const sample='Authorization: Bearer abcdefghi.Jklmnopqrst secret@example.org AI_LLM_KEY=supersecret ghp_abcdefghijklmno';
  const cleaned=redact(sample);
  assert.ok(!cleaned.includes('secret@example.org'));
  assert.ok(!cleaned.includes('abcdefghijklmno'));
  assert.ok(!cleaned.includes('supersecret'));
});
test('Android release must match correct package and verify APK v2 or v3',()=>{
  const badge="package: name='com.greenplus.client' versionCode='2'";
  const signature='Verified using v2 scheme (APK Signature Scheme v2): true\nSigner #1 certificate SHA-256 digest: '+'a'.repeat(64);
  assert.equal(parseBadging(badge),'com.greenplus.client');
  assert.equal(parseSignatures(signature).v2,true);
  assert.equal(validateResults('client',badge,signature).signingVerified,true);
  assert.throws(()=>validateResults('shipper',badge,signature),/Unexpected Android package/);
  assert.throws(()=>validateResults('client',badge,signature.replace('true','false')),/verification failed/);
});


test('Windows Python launcher detection and missing interpreter are distinct',()=>{
  const valid=(cmd,args)=>({status:cmd==='py'&&args.includes('-3')?0:1,stdout:cmd==='py'?'3\n':''});
  const found=detectPython({platform:'win32',env:{},probe:valid});
  assert.equal(found.cmd,'py');
  assert.deepEqual(found.args,['-3']);
  assert.equal(found.available,true);
  const missing=detectPython({platform:'win32',env:{},probe:()=>({status:1,stdout:''})});
  assert.equal(missing.available,false);
  assert.match(missing.reason,/install Python/i);
});

test('recheck only executes previously failed gates, without overwriting pass evidence',()=>{
  const plan=createPlan(parseOptions(['--full']));
  const previously={groups:[
    {area:AREAS[0],checks:[{check:'FastAPI AI unit tests',status:'FAIL'}]},
    {area:AREAS[4],checks:[{check:'admin ESLint',status:'FAIL'}, {check:'admin production build',status:'PASS'}, {check:'shipper production build',status:'FAIL'}]},
    {area:AREAS[7],checks:[{check:'Runtime dependency advisory (high/critical block, provider outages report warning)',status:'FAIL'}]},
  ]};
  const reduced=selectFailedSteps(plan,previously);
  assert.deepEqual(reduced.map(group=>[group.area,group.checks.length]),[[AREAS[0],1],[AREAS[4],2],[AREAS[7],1]]);
  assert.ok(!reduced.flatMap(g=>g.checks).some(step=>step.label==='admin production build'));
});

test('diagnostics preserve actual error and exit cause, redact credentials',()=>{
  const details=diagnoseFailure({stdout:'Starting...\nError: MODULE_NOT_FOUND\nfrom secret@example.com\n',stderr:'Authorization: Bearer abcdefghijklmno',error:{code:'ETIMEDOUT',message:'timed out'}});
  assert.match(details,/ETIMEDOUT/);
  assert.match(details,/MODULE_NOT_FOUND/);
  assert.ok(!details.includes('secret@example.com'));
  assert.ok(!details.includes('abcdefghijklmno'));
});
