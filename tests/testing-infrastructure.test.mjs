import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parseOptions,createPlan} from '../scripts/testing/acceptance-runner.mjs';
import {parseArguments} from '../scripts/testing/system-smoke.mjs';
import {parsePerformanceArguments} from '../scripts/testing/performance-smoke.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('test acceptance runs every core gate without silently accepting unexpected options',()=>{
 assert.deepEqual(parseOptions([]),{full:false,browser:false});
 assert.deepEqual(parseOptions(['--full','--with-browser']),{full:true,browser:true});
 assert.throws(()=>parseOptions(['--quick','--full']));
 assert.throws(()=>parseOptions(['--ignore-failures']));
 const names=createPlan(parseOptions([])).map(row=>row[0]);
 for(const required of ['Root Node unit & contract','HTTP/API/telemetry integration','CI/CD static guard','Supabase immutable migration gate','Static security audit'])
  assert.ok(names.includes(required),required);
});
test('system performance tooling cannot accidentally target remote HTTP or flood a remote free tier',()=>{
 assert.throws(()=>parseArguments(['--allow-remote','--admin','http://external.example']),/HTTPS/);
 assert.throws(()=>parseArguments(['--allow-remote','--admin','https://token@external.example']),/Invalid/);
 assert.throws(()=>parsePerformanceArguments(['--samples','21']),/samples/);
 assert.throws(()=>parsePerformanceArguments(['--samples','9','--allow-remote','--admin','https://external.example']),/limited/);
});
test('CI includes browser, HTTP integration, SQL metadata, Docker smoke and advisory vendor policy',()=>{
 const ci=read('../.github/workflows/ci.yml');
 for(const expected of ['tests/integration/*.test.mjs','playwright.ci.config.mts','smoke-images.sh','supabase test db','check-external.mjs','--advisory','docker-system-smoke.json'])
  assert.ok(ci.includes(expected),expected);
 for(const file of ['../docs/testing/TEST_PLAN.md','../docs/testing/TEST_CASES.md','../tests/e2e/public-and-security.spec.ts',
 '../supabase/tests/database/002_tenant_security_contract.test.sql','../scripts/testing/performance-smoke.mjs'])
  assert.equal(existsSync(new URL(file,import.meta.url)),true,file);
});
