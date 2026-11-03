import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { checkProviders,missingConfig } from '../scripts/ci/check-external.mjs';
import { verifyDeployments } from '../scripts/ci/check-vercel-deployments.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=p=>readFileSync(resolve(root,p),'utf8');
const env={
 SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'anon',VERCEL_TOKEN:'vtoken',
 VERCEL_PROJECT_ADMIN:'prj_admin',VERCEL_PROJECT_CLIENT:'prj_client',VERCEL_PROJECT_SHIPPER:'prj_shipper',
 SENTRY_AUTH_TOKEN:'stoken',SENTRY_ORG:'example-org',SENTRY_PROJECT_ADMIN:'admin',SENTRY_PROJECT_CLIENT:'client',SENTRY_PROJECT_SHIPPER:'shipper',
 BETTER_STACK_SOURCE_TOKEN:'btoken',BETTER_STACK_URL:'https://in.logs.betterstack.com',GITHUB_SHA:'1234567890',
};
test('all required checks block docker publishing until passed',()=>{
 const y=read('.github/workflows/ci.yml');
 assert.match(y,/needs: \[pipeline-contracts, frontend-ci, backend-ci, docker-db-ci, supabase-db-ci, external-services-ci\]/);
 assert.match(y,/node --experimental-strip-types --test tests\/\*\.test\.mjs/);
 assert.match(y,/npm run docker:three-tier:check/);
 assert.match(y,/node scripts\/test-three-tier-lifecycle\.mjs/);
 assert.match(y,/supabase db reset --local --no-seed/);
 assert.doesNotMatch(y,/continue-on-error: true/);
});
test('missing external secrets explicitly block main (no silent skip)',()=>{
 assert.ok(missingConfig({}).includes('SENTRY_AUTH_TOKEN'));
 assert.deepEqual(missingConfig(env),[]);
});
test('external probes require actual valid responses for every provider',async()=>{
 let calls=[];
 const mock=async(url,options)=>{
  calls.push([url,options.method]);
  if(url.includes('/v9/projects/'))return {status:200,json:async()=>({id:'prj_x'})};
  if(url.includes('sentry.io/api/0'))return {status:200,json:async()=>({id:'1',slug:'ok'})};
  if(url.includes('betterstack.com'))return {status:202,json:async()=>({})};
  return {status:200,json:async()=>({ok:true})};
 };
 await checkProviders(env,mock,()=>{});
 assert.equal(calls.length,9);
 assert.equal(calls.filter(c=>c[1]==='POST').length,1);
});
test('external failure must reject, never just warn',async()=>{
 const mock=async()=>({status:403,json:async()=>({})});
 await assert.rejects(checkProviders(env,mock,()=>{}),/HTTP 403/);
});
test('provider tokens are not inserted into URL paths',async()=>{
 const urls=[];
 const mock=async(url)=>{urls.push(url);return {status:200,json:async()=>({id:'x',slug:'x'})};};
 await assert.rejects(checkProviders(env,mock,()=>{}),/expected 202/);
 assert.ok(urls.every(u=>!u.includes('stoken') && !u.includes('vtoken') && !u.includes('btoken')));
});

test('Vercel post-CI promotion checks the exact tested SHA, not an older READY deployment',async()=>{
 const deployments=[
  {meta:{githubCommitSha:'older'},readyState:'READY'},
  {meta:{githubCommitSha:'1234567890'},readyState:'READY'},
 ];
 const mock=async()=>({status:200,json:async()=>({deployments})});
 const observed=[];
 await verifyDeployments(env,mock,()=>{},s=>observed.push(s));
 assert.equal(observed.length,3);
});
test('Vercel post-CI fails when the exact commit is rejected',async()=>{
 const mock=async()=>({status:200,json:async()=>({deployments:[{meta:{githubCommitSha:'1234567890'},readyState:'ERROR'}]})});
 await assert.rejects(verifyDeployments(env,mock,()=>{},()=>{}),/failed: ERROR/);
});
