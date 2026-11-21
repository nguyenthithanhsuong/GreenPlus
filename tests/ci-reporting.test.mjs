import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {probeProviders,renderExternalReport} from '../scripts/ci/check-external.mjs';
import {summarizeCiNeeds,renderCiSummary,requiredJobs} from '../scripts/ci/ci-report.mjs';
import {fetchWorkflowJobs,renderActionReport} from '../scripts/ci/github-actions-report.mjs';
import {tasks,renderQualityReport,runQualityReport} from '../scripts/ci/quality-report.mjs';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const env={
 SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_test',VERCEL_TOKEN:'private-vtoken',
 VERCEL_PROJECT_ADMIN:'admin',VERCEL_PROJECT_CLIENT:'client',VERCEL_PROJECT_SHIPPER:'shipper',
 SENTRY_AUTH_TOKEN:'private-stoken',SENTRY_ORG:'org',SENTRY_PROJECT_ADMIN:'admin',SENTRY_PROJECT_CLIENT:'client',SENTRY_PROJECT_SHIPPER:'shipper',
 BETTER_STACK_SOURCE_TOKEN:'private-btoken',BETTER_STACK_URL:'https://in.logs.betterstack.com',GITHUB_SHA:'deadbeef',
};
test('all nine external provider checks independently report warnings, no secrets, no throw',async()=>{
 const calls=[];
 const fetcher=async (url,opts)=>{
  calls.push(url);
  if(url.includes('sentry.io'))return {status:503,json:async()=>({token:'private-stoken'})};
  if(url.includes('/rest/v1/stores'))return {status:200,json:async()=>([])};
  if(url.includes('/v9/projects/'))return {status:200,json:async()=>({id:'1'})};
  if(url.includes('betterstack'))return {status:202,json:async()=>({})};
  return {status:200,json:async()=>({ok:true})};
 };
 const report=await probeProviders(env,fetcher);
 assert.equal(report.results.length,9);
 assert.equal(calls.length,9,'a failed provider may not skip others');
 assert.equal(report.overall,'warning');
 assert.equal(report.results.filter(r=>r.status==='warning').length,3);
 const body=JSON.stringify(report)+renderExternalReport(report);
 for(const secret of ['private-vtoken','private-stoken','private-btoken'])assert.ok(!body.includes(secret));
});
test('missing external credentials are warnings but no network calls are attempted',async()=>{
 const report=await probeProviders({},()=>{throw Error('should not call');});
 assert.equal(report.results.length,9);
 assert.ok(report.results.every(r=>r.status==='warning' && r.reason.startsWith('MISSING_CONFIG')));
});
test('failed code gate remains blocked in CI/CD summary even if external services pass',()=>{
 const needs=Object.fromEntries(requiredJobs.map(([id])=>[id,{result:'success'}]));
 needs['frontend-ci']={result:'failure'};
 needs['external-services-ci']={result:'success'};
 const report=summarizeCiNeeds(needs,{results:[{provider:'Sentry',status:'warning',reason:'HTTP_503'}]});
 assert.equal(report.overall,'blocked');
 const markdown=renderCiSummary(report);
 assert.match(markdown,/❌ Blocked or incomplete/);
 assert.match(markdown,/HTTP_503/);
});
test('CI reporting is fail-open for diagnostics only, not code gate results',()=>{
 const needs=Object.fromEntries(requiredJobs.map(([id])=>[id,{result:'success'}]));
 needs['external-services-ci']={result:'success'};
 assert.equal(summarizeCiNeeds(needs,null).overall,'passed');
 needs['docker-build']={result:'skipped'};
 assert.equal(summarizeCiNeeds(needs,null).overall,'blocked');
});
test('GitHub Actions reports only use fixed GitHub API origin and no token in URL',async()=>{
 const calls=[];
 const jobs=await fetchWorkflowJobs({repo:'org/project',runId:'123',token:'private-gh-token',fetcher:async(url,options)=>{
   calls.push([url,options.headers.Authorization]);
   return {ok:true,json:async()=>({jobs:[{name:'CI/CD Report',conclusion:'success',id:42}]})};
 }});
 assert.equal(jobs.length,1);
 assert.equal(calls[0][0],'https://api.github.com/repos/org/project/actions/runs/123/jobs?per_page=100&page=1');
 assert.equal(calls[0][1],'Bearer private-gh-token');
 assert.ok(!renderActionReport({name:'CI',conclusion:'failure',id:123,repository:{full_name:'org/project'}},jobs).includes('private-gh-token'));
});
test('GitHub Actions report truthfully shows original failed run and sanitizes job titles',()=>{
 const summary=renderActionReport({name:'CI',conclusion:'failure',id:123,repository:{full_name:'org/project'}},[{name:'<bad>|job\n',conclusion:'failure'}]);
 assert.match(summary,/Original result:\*\* ❌ FAIL/);
 assert.doesNotMatch(summary,/<bad>|\|job\n/);
 assert.match(summary,/does not imply the original run passed/);
});
test('lint/typecheck report includes all three apps, no error swallowing',()=>{
 assert.equal(tasks.length,6);
 const report=renderQualityReport(tasks.map(t=>({...t,status:t.app==='client'?'fail':'pass'})));
 assert.match(report,/web-client/);
 assert.match(report,/❌ fail/);
});
test('Docker release uses consistent Node 22 standalone and non-root runners',()=>{
 for(const app of ['admin','client','shipper']){
   const df=read(`web-${app}/Dockerfile`);
   assert.match(df,/FROM node:22-alpine AS deps/);
   assert.match(df,/USER greenplus/);
   assert.match(df,new RegExp(`CMD \\["node", "server.js"\\]`));
   assert.doesNotMatch(df,/COPY --from=builder \/app \.\s*$/m);
 }
});
test('Actions has dedicated CI/CD Reports workflow and required CI job summary',()=>{
 assert.match(read('.github/workflows/ci-cd-reports.yml'),/name: CI\/CD Reports/);
 assert.match(read('.github/workflows/ci.yml'),/name: CI\/CD Report/);
 assert.match(read('.github/workflows/ci.yml'),/run: node scripts\/ci\/ci-report.mjs/);
 assert.match(read('.github/workflows/ci.yml'),/node scripts\/ci\/check-external.mjs --output/);
 assert.match(read('.github/workflows/ci.yml'),/run: node scripts\/ci\/check-docker-tenants.mjs/);
});
