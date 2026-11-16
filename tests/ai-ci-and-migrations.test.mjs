import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const load=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('AI CI blocks Docker publication and runs Python tests plus image smoke',()=>{
 const y=load('.github/workflows/ci.yml');
 assert.match(y,/ai-service-ci:/);
 assert.match(y,/needs: \[pipeline-contracts, frontend-ci, backend-ci, ai-service-ci/);
 assert.match(y,/python -m pytest -q services\/ai-assist\/tests/);
 assert.match(y,/greenplus\/ai-assist:ci/);
 assert.match(y,/test "\$status" = 401/);
});
test('sensitive AI actions have explicit Manager authorization in SQL',()=>{
 const sql=load('supabase/migrations/0016_ai_assist_and_communications.sql');
 assert.match(sql,/FUNCTION public\.ai_decide_promotion/);
 assert.match(sql,/r\.is_manager=true/);
 assert.match(sql,/FOR UPDATE/);
 assert.match(sql,/INSERT INTO public\.audit_logs/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.ai_consume_quota/);
 assert.match(sql,/TO service_role/);
 assert.match(sql,/REVOKE ALL ON public\.ai_knowledge/);
});
test('checkout applies an approved store-scoped active promotion atomically',()=>{
 const sql=load('supabase/migrations/0017_checkout_approved_promotions.sql');
 for(const term of ["prm.store_id = p_store_id","prm.status = 'active'","prm.start_at <= now()","prm.end_at > now()","prm.batch_id = b.batch_id","FOR UPDATE OF i","UPDATE public.orders","idempotency_key"])
  assert.ok(sql.includes(term),term);
});
test('human communication restricts threads to actors with an actual order relation',()=>{
 const sql=load('supabase/migrations/0016_ai_assist_and_communications.sql');
 assert.match(sql,/ai_verify_thread/);
 assert.match(sql,/o\.user_id=NEW\.customer_id/);
 assert.match(sql,/d\.employee_id=NEW\.shipper_id/);
 for(const app of ['web-admin','web-client','web-shipper']){
  assert.ok(existsSync(new URL(`../${app}/src/app/api/support/threads/route.ts`,import.meta.url)));
  assert.ok(existsSync(new URL(`../${app}/src/app/api/support/threads/[threadId]/messages/route.ts`,import.meta.url)));
 }
});
test('client and shipper include role-aware AI pages',()=>{
 for(const file of ['web-client/src/app/ai/chat/page.tsx','web-client/src/app/ai/recipes/page.tsx','web-client/src/app/support/page.tsx','web-shipper/src/app/ai/chat/page.tsx','web-shipper/src/app/support/page.tsx','web-admin/src/app/ai/page.tsx'])
  assert.ok(existsSync(new URL('../'+file,import.meta.url)),file);
 const code=load('web-admin/src/lib/portal-access.ts');
 assert.match(code,/"\/ai\/chat"/);
 assert.match(code,/"\/ai\/support"/);
});
test('AI scheduled analysis is disabled without explicit secret and opt-in',()=>{
 const route=load('web-admin/src/app/api/ai/cron/route.ts');
 assert.match(route,/GREENPLUS_AI_JOBS_ENABLED/);
 assert.match(route,/timingSafeEqual/);
 assert.match(route,/GREENPLUS_AI_CRON_SECRET/);
});
test('Docker three-tier AI preview is read-only and distinct from production database',()=>{
 const file=load('web-admin/src/app/api/ai/docker-preview/route.ts');
 assert.match(file,/portalActor/);
 assert.match(file,/greenplus_admin_storage_view/);
 assert.match(file,/fetchDockerGateway/);
 assert.match(file,/previewOnly:true/);
 assert.doesNotMatch(file,/from\("ai_forecasts"\)\.insert/);
});
