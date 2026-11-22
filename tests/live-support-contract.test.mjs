import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=(file)=>readFileSync(resolve(root,file),'utf8');
test('three apps expose protected general support endpoints and separate read/write ability',()=>{
 for(const app of ['web-admin','web-client','web-shipper']){
  for(const part of ['inquiries/route.ts','inquiries/[inquiryId]/messages/route.ts']){
   const file=`${app}/src/app/api/support/${part}`;
   assert.ok(existsSync(resolve(root,file)),file);
   const text=read(file);
   assert.match(text,/requireJsonOrigin\(request\)/);
   assert.match(text,/"support.write"/);
   assert.match(text,/"Cache-Control":"no-store"/);
   assert.match(text,/apiFailure\(error\)/);
  }
 }
});
test('general support UI is accessible from all three help pages and does not require an order ID',()=>{
 for(const [app,path] of [['web-admin','/ai/support/live'],['web-client','/support/live'],['web-shipper','/support/live']]){
  assert.ok(read(`${app}/src/app/help/page.tsx`).includes(path));
 }
 const component=read('packages/support-ui/LiveSupportView.tsx');
 assert.doesNotMatch(component,/orderId|order_id/);
 assert.match(component,/aria-live="polite"/);
 assert.match(component,/lg:grid-cols/);
 assert.match(component,/document.visibilityState/);
});
test('new SQL is manual only, quota is atomic, RLS enabled and direct user grants revoked',()=>{
 const sql=read('supabase/migrations/0022_support_inquiries_and_throttling.sql');
 assert.match(sql,/MANUAL REVIEW REQUIRED/);
 assert.match(sql,/ON CONFLICT\(store_id,actor_id,action,hour_bucket\)/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/g);
 assert.match(sql,/REVOKE ALL ON public.support_inquiries,public.support_inquiry_messages FROM PUBLIC,anon,authenticated/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public.gp_consume_submission_quota/);
 const code=read('packages/ai-core/support-server.mjs');
 assert.match(code,/gp_consume_submission_quota/);
});

test('desktop storefront has separate responsive product/category grids',async()=>{
 const root=new URL('../web-client/',import.meta.url);
 const [dashboard,css]=await Promise.all([
   Promise.resolve(readFileSync(new URL('frontend/dashboard/components/Dashboard.tsx',root),'utf8')),
   Promise.resolve(readFileSync(new URL('src/app/globals.css',root),'utf8')),
 ]);
 assert.match(dashboard,/gp-desktop-product-grid/);
 assert.match(dashboard,/gp-desktop-category-grid/);
 assert.match(css,/@media \(min-width: 1024px\)/);
 assert.match(css,/\.gp-desktop-product-grid\s*\{[^}]*repeat\(4,/);
});

test('Tailwind v4 scans the shared support component from all three apps',()=>{
 for(const app of ['web-admin','web-client','web-shipper']){
  assert.match(read(`${app}/src/app/globals.css`),/@source "\.\.\/\.\.\/\.\.\/packages\/support-ui";/);
 }
});
