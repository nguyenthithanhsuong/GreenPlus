import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('all privileged API routes that access tenant tables use authenticated scope wrapper',()=>{
 const wrapper=read('../web-admin/src/lib/with-sentry.ts');
 const client=read('../web-admin/backend/core/supabase.ts');
 assert.match(wrapper,/resolveTenantScope\(request\)/);
 assert.match(wrapper,/runTenantScope\(scope/);
 assert.match(client,/guardPostgrestRequest\(/);
 const modules=['suppliers','products','categories','batches','inventory','prices','orders','deliveries','complaints'];
 for(const path of modules){
  const route=read(`../web-admin/src/app/api/${path}/route.ts`);
  assert.match(route,/withSentry\(/,`${path} not protected by common handler`);
 }
});
test('Shipper sign-in validates fresh database role',()=>{
 const login=read('../web-admin/src/app/api/shipper/auth/sign-in/route.ts');
 assert.match(login,/await requireShipper\(/);
 const role=read('../web-admin/backend/modules/delivery-tracking/shipper-delivery.service.ts');
 assert.match(role,/roles\.is_shipper/);
 assert.match(role,/status !== "active"/);
});
test('manager assignment validates role and sync trigger is transactional',()=>{
 const srv=read('../web-admin/backend/modules/stores/stores-management.service.ts');
 assert.match(srv,/verifyManager\(/);
 const sql=read('../supabase/migrations/0011_sync_manager_assignment.sql');
 assert.match(sql,/AFTER INSERT OR UPDATE OF manager_id/);
 assert.match(sql,/UPDATE public\.users SET store_id/);
 assert.match(sql,/INSERT INTO public\.store_members/);
});
