import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchWorkflowJobs, buildActionReport, renderActionReport } from '../scripts/ci/github-actions-report.mjs';
import { renderCiSummary, summarizeCiNeeds, requiredJobs } from '../scripts/ci/ci-report.mjs';
const root=resolve(import.meta.dirname,'..');
const run={id:137,name:'CI',conclusion:'failure',event:'push',run_attempt:2,head_branch:'main',
  head_sha:'a'.repeat(40),created_at:'2026-11-22T12:00:00Z',repository:{full_name:'demo/GreenPlus'}};
const steps=[
  {number:1,name:'Checkout',status:'completed',conclusion:'success',started_at:'2026-11-22T12:00:00Z',completed_at:'2026-11-22T12:00:03Z'},
  {number:2,name:'Immutable migration gate',status:'completed',conclusion:'failure',started_at:'2026-11-22T12:00:03Z',completed_at:'2026-11-22T12:00:08Z'},
  {number:3,name:'Image publish',status:'completed',conclusion:'skipped'}
];

test('downloads original GitHub job step metadata, not token-bearing logs or artifacts',async()=>{
  const requests=[];
  const jobs=await fetchWorkflowJobs({repo:'demo/GreenPlus',runId:137,token:'private-example-token',fetcher:async(url,options)=>{
    requests.push({url,authorization:options.headers.Authorization});
    return {ok:true,json:async()=>({jobs:[{id:812,name:'Docker DB CI',conclusion:'failure',status:'completed',started_at:'2026-11-22T12:00:00Z',completed_at:'2026-11-22T12:00:08Z',steps}]})};
  }});
  assert.equal(requests.length,1);
  assert.match(requests[0].url,/^https:\/\/api.github.com\/repos\/demo\/GreenPlus\/actions\/runs\/137\/jobs\?/);
  assert.equal(jobs[0].steps[1].duration_seconds,5);
  assert.equal(jobs[0].steps[2].conclusion,'skipped');
  const json=buildActionReport(run,jobs);
  const md=renderActionReport(run,jobs);
  assert.equal(json.schema_version,2);
  assert.equal(json.failures[0].first_failed_step,'Immutable migration gate');
  assert.match(md,/## 2\. Job execution flow/);
  assert.match(md,/## 4\. Detailed steps per job/);
  assert.match(md,/\| 2 \| Immutable migration gate \| completed \| ❌ FAIL \| 5s \|/);
  assert.match(md,/\| 3 \| Image publish \| completed \| ⏭️ SKIPPED \|/);
  assert.match(md,/https:\/\/github.com\/demo\/GreenPlus\/actions\/runs\/137\/job\/812/);
  assert.doesNotMatch(JSON.stringify(json)+md,/private-example-token/);
  assert.match(md,/does not imply the original run passed/);
});
test('missing step metadata stays unknown, not invented PASS',()=>{
  const md=renderActionReport(run,[{id:300,name:'Missing metadata',conclusion:'failure'}]);
  assert.match(md,/Step metadata unavailable/);
  assert.match(md,/See job logs/);
  const data=buildActionReport(run,[{id:300,name:'Missing metadata',conclusion:'failure'}]);
  assert.equal(data.failures[0].first_failed_step,null);
});
test('downloadable overview describes blockers and future per-step report',()=>{
  const needs=Object.fromEntries(requiredJobs.map(([id])=>[id,{result:'success'}]));
  needs['supabase-db-ci']={result:'failure'};
  needs['docker-build']={result:'skipped'};
  const md=renderCiSummary(summarizeCiNeeds(needs,null));
  assert.match(md,/CI execution and release decision/);
  assert.match(md,/Blocking gates not passed:\*\* 2/);
  assert.match(md,/actions-report\.md/);
  assert.match(md,/Not executed: check upstream required gate failures/);
});
test('both workflow archives retain report markdown and JSON without source docs',()=>{
  const ci=readFileSync(resolve(root,'.github/workflows/ci.yml'),'utf8');
  const report=readFileSync(resolve(root,'.github/workflows/ci-cd-reports.yml'),'utf8');
  for(const [text,base] of [[ci,'ci-report'],[report,'actions-report']]){
    assert.ok(text.includes(`artifacts/ci/${base}.json`));
    assert.ok(text.includes(`artifacts/ci/${base}.md`));
  }
});
