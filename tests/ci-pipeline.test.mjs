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
 assert.match(y,/uses: supabase\/setup-cli@v3/);
 assert.match(y,/version: v2\.stable/);
 assert.doesNotMatch(y,/uses: supabase\/setup-cli@v1/);
});
test('missing external secrets explicitly block main (no silent skip)',()=>{
 assert.ok(missingConfig({}).includes('SENTRY_AUTH_TOKEN'));
 assert.deepEqual(missingConfig(env),[]);
});
test('external probes require actual valid responses for every provider',async()=>{
 let calls=[];
 const mock=async(url,options)=>{
  calls.push([url,options.method]);
  if(url.includes('/rest/v1/stores?'))return {status:200,json:async()=>([])};
  if(url.includes('/v9/projects/'))return {status:200,json:async()=>({id:'prj_x'})};
  if(url.includes('sentry.io/api/0'))return {status:200,json:async()=>({id:'1',slug:'ok'})};
  if(url.includes('betterstack.com'))return {status:202,json:async()=>({})};
  return {status:200,json:async()=>({ok:true})};
 };
 await checkProviders(env,mock,()=>{});
 assert.equal(calls.length,9);
 assert.equal(calls.filter(c=>c[1]==='POST').length,1);
 assert.ok(calls.some(([url,method])=>url.includes('/rest/v1/stores?select=store_id&limit=0') && method==='GET'));
 assert.ok(!calls.some(([url])=>url.endsWith('/rest/v1/')));
});
test('external failure must reject, never just warn',async()=>{
 const mock=async()=>({status:403,json:async()=>({})});
 await assert.rejects(checkProviders(env,mock,()=>{}),/HTTP 403/);
});
test('provider tokens are not inserted into URL paths',async()=>{
 const urls=[];
 const mock=async(url)=>{
  urls.push(url);
  if(url.includes('/rest/v1/stores?'))return {status:200,json:async()=>([])};
  return {status:200,json:async()=>({id:'x',slug:'x'})};
 };
 await assert.rejects(checkProviders(env,mock,()=>{}),/expected 202/);
 assert.ok(urls.every(u=>!u.includes('stoken') && !u.includes('vtoken') && !u.includes('btoken')));
});

test('REST probe rejects public-key denial instead of treating 401/403 as success',async()=>{
 const mock=async(url)=>url.includes('/rest/v1/stores?')
   ? {status:401,json:async()=>({code:'PGRST301'})}
   : {status:200,json:async()=>({ok:true})};
 await assert.rejects(checkProviders(env,mock,()=>{}),/HTTP 401/);
});
test('REST probe rejects 200 with an invalid shape',async()=>{
 const mock=async(url)=>url.includes('/rest/v1/stores?')
   ? {status:200,json:async()=>({message:'not a result array'})}
   : {status:200,json:async()=>({ok:true})};
 await assert.rejects(checkProviders(env,mock,()=>{}),/invalid JSON array/);
});
test('REST probe uses a legacy JWT as bearer but never sends a publishable key as bearer',async()=>{
 const base=async(url)=>url.includes('/rest/v1/stores?')
   ? {status:200,json:async()=>([])}
   : url.includes('/v9/projects/')
     ? {status:200,json:async()=>({id:'prj_x'})}
     : url.includes('sentry.io/')
       ? {status:200,json:async()=>({id:'1',slug:'ok'})}
       : url.includes('betterstack.com')
         ? {status:202,json:async()=>({})}
         : {status:200,json:async()=>({ok:true})};
 for(const [key,expectedAuth] of [['sb_publishable_test123',undefined],['eyJhbGciOiJIUzI1NiJ9.e30.signature','Bearer eyJhbGciOiJIUzI1NiJ9.e30.signature']]){
   let restAuth;
   await checkProviders({...env,SUPABASE_ANON_KEY:key},async(url,options)=>{
     if(url.includes('/rest/v1/stores?')){
       assert.equal(options.headers.apikey,key);
       restAuth=options.headers.Authorization;
     }
     return base(url);
   },()=>{});
   assert.equal(restAuth,expectedAuth);
 }
});
test('Playwright config has a CommonJS-safe workspace path on Linux CI',()=>{
 const config=read('web-shipper/playwright.config.ts');
 assert.doesNotMatch(config,/import\.meta/);
 assert.match(config,/const workspace = __dirname/);
 assert.match(config,/artifacts\/playwright\/web-shipper/);
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


test('Vercel checks all three commit deployments concurrently without weakening SHA validation', async () => {
 let active = 0, peak = 0;
 const mock = async () => {
  active++; peak = Math.max(peak, active);
  await Promise.resolve();
  active--;
  return { status: 200, json: async () => ({ deployments: [{ meta: { githubCommitSha: env.GITHUB_SHA }, readyState: 'READY' }] }) };
 };
 await verifyDeployments(env, mock, () => {}, () => {});
 assert.equal(peak, 3, 'one slow Vercel project must not block checks for the others');
});
