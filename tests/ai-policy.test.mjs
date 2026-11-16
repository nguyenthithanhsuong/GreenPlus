import test from 'node:test';
import assert from 'node:assert/strict';
import {canAi,assertSameStore,hourlyLimit,safeText,validUuid} from '../packages/ai-core/policy.mjs';
import {canStartThread,canAccessOrderThread} from '../packages/ai-core/support-policy.mjs';
const store='11111111-1111-4111-8111-111111111111';
const second='22222222-2222-4222-8222-222222222222';
const actor=(role)=>({role,userId:'owner',storeIds:[store]});
const thread={store_id:store,customer_id:'customer',shipper_id:'shipper'};

test('all five roles can ask the knowledge assistant',()=>{
 for(const role of ['admin','manager','employee','shipper','customer']){
  assert.equal(canAi(role,'chat'),true);
  assert.ok(hourlyLimit(role)>=10);
 }
 assert.equal(canAi('anonymous','chat'),false);
});
test('only manager may generate and decide promotion suggestions',()=>{
 for(const role of ['admin','employee','shipper','customer']){
  assert.equal(canAi(role,'promotion.generate'),false);
  assert.equal(canAi(role,'promotion.decide'),false);
 }
 assert.equal(canAi('manager','promotion.generate'),true);
 assert.equal(canAi('manager','promotion.decide'),true);
});
test('tenant ids and untrusted user text are validated',()=>{
 assert.ok(validUuid(store));assert.equal(validUuid('../../etc/passwd'),false);
 assert.doesNotThrow(()=>assertSameStore(store,store));
 assert.throws(()=>assertSameStore(store,second),/Cross-store/);
 assert.equal(safeText('  hello  ',20),'hello');
 assert.equal(safeText('x'.repeat(2000),200),null);
});
test('customer reads only owned order; shipper reads only assigned order',()=>{
 assert.ok(canAccessOrderThread({role:'customer',userId:'customer',storeIds:[store]},thread));
 assert.equal(canAccessOrderThread(actor('customer'),thread),false);
 assert.ok(canAccessOrderThread({role:'shipper',userId:'shipper',storeIds:[store]},thread));
 assert.equal(canAccessOrderThread(actor('shipper'),thread),false);
 assert.equal(canStartThread({role:'customer',userId:'customer',storeIds:[second]}, {...thread,user_id:'customer'}),false);
 assert.ok(canStartThread({role:'shipper',userId:'shipper',storeIds:[store]}, {...thread,user_id:'customer'}));
});
test('admin only reads escalated conversations, not routine tenant operations',()=>{
 assert.equal(canAccessOrderThread({...actor('admin'),escalated:false},thread),false);
 assert.equal(canAccessOrderThread({...actor('admin'),escalated:true},thread),true);
 assert.equal(canStartThread(actor('admin'),{...thread,user_id:'customer'}),false);
 assert.equal(canStartThread(actor('manager'),{...thread,user_id:'customer'}),true);
});

test('manager promotion product picker is tenant scoped and filters unavailable batches', async()=>{
 const {readFile} = await import('node:fs/promises');
 const options = await readFile(new URL('../web-admin/src/app/api/ai/product-options/route.ts',import.meta.url),'utf8');
 const ui = await readFile(new URL('../web-admin/frontend/ai/AiPromotions.tsx',import.meta.url),'utf8');
 assert.match(options,/requireAiActor\(request,\s*"promotion\.decide"/);
 assert.ok((options.match(/\.eq\("store_id",\s*actor\.storeId\)/g)??[]).length >= 2);
 assert.match(options,/\.eq\("status",\s*"available"\)/);
 assert.match(options,/\.gte\("expire_date",\s*today\)/);
 assert.match(ui, /<select[^>]*value=\{productId\}/);
 assert.match(ui,/options\.products\.map/);
 assert.match(ui,/selectedBatches\.map/);
 assert.doesNotMatch(ui,/placeholder="UUID/);
});

test('SQL promotion approval verifies active product and batch belong to same tenant',async()=>{
 const {readFile} = await import('node:fs/promises');
 const sql=await readFile(new URL('../supabase/migrations/0016_ai_assist_and_communications.sql',import.meta.url),'utf8');
 assert.match(sql,/p\.product_id=suggestion\.product_id AND p\.store_id=p_store/);
 assert.match(sql,/b\.batch_id=suggestion\.batch_id AND b\.product_id=suggestion\.product_id AND b\.store_id=p_store/);
 assert.match(sql,/FOR UPDATE/);
 assert.match(sql,/INSERT INTO public\.audit_logs/);
});
