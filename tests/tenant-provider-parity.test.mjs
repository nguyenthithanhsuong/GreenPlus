import test from 'node:test';
import assert from 'node:assert/strict';
import {TENANT_TABLES,TENANT_WRITABLE_FIELDS} from '../packages/tenant-routing/tenant-schema.mjs';
import {createTenantPostgrestAdapter} from '../packages/tenant-routing/postgrest-adapter.mjs';
import {createTenantPostgresAdapter} from '../packages/tenant-routing/postgres-adapter.mjs';
const store='11111111-1111-4111-8111-111111111111';
const wrong='22222222-2222-4222-8222-222222222222';
const id='33333333-3333-4333-8333-333333333333';
function createHarness(rows=[{store_id:store}]) {
 const http=[];const sql=[];
 const pg=createTenantPostgresAdapter({route:{storeId:store,schema:'public'},pool:{async query(statement,args){sql.push({statement,args});return{rows};}}});
 const rest=createTenantPostgrestAdapter({route:{storeId:store,schema:'public',kind:'postgrest',url:'http://localhost:3000/'},headers:{Authorization:'Bearer mock'},fetchImpl:async(url,init)=>{
  http.push({url:new URL(url),init});return new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}});
 }});
 return {pg,rest,http,sql};
}
test('both transports support all 21 tenant-owned read collections by the same API',async()=>{
 assert.equal(Object.keys(TENANT_TABLES).length,21);
 for(const [table,meta] of Object.entries(TENANT_TABLES)){
  const {pg,rest,http,sql}=createHarness();
  await pg.list(table,{limit:3,offset:5});
  await rest.list(table,{limit:3,offset:5});
  assert.deepEqual(sql[0].args,[store,3,5]);
  assert.equal(http[0].url.searchParams.get('store_id'),`eq.${store}`);
  assert.equal(http[0].url.searchParams.get('order'),`${meta.sort}.${meta.descending?'desc':'asc'}`);
  await pg.find(table,id);
  await rest.find(table,id);
  assert.equal(http[1].url.searchParams.get(meta.id),`eq.${id}`);
 }
});
test('neither adapter silently permits writes outside validated product/category fields',async()=>{
 assert.deepEqual(Object.keys(TENANT_WRITABLE_FIELDS).sort(),['categories','products']);
 const {pg,rest,http,sql}=createHarness();
 for(const collection of ['payments','orders','inventory','suppliers']){
  await assert.rejects(pg.insert(collection,{status:'paid'}),/dedicated validated domain/);
  await assert.rejects(rest.insert(collection,{status:'paid'}),/dedicated validated domain/);
  await assert.rejects(pg.delete(collection,id),/dedicated validated domain/);
  await assert.rejects(rest.delete(collection,id),/dedicated validated domain/);
 }
 for(const c of ['products','categories']){
  await assert.rejects(pg.update(c,id,{store_id:wrong}),/ownership/);
  await assert.rejects(rest.update(c,id,{store_id:wrong}),/ownership/);
  await assert.rejects(pg.update(c,id,{is_admin:true}),/Unsupported write/);
  await assert.rejects(rest.update(c,id,{is_admin:true}),/Unsupported write/);
 }
 assert.equal(sql.length,0);assert.equal(http.length,0);
});
test('both adapters fail closed on foreign tenant records',async()=>{
 const {pg,rest}=createHarness([{store_id:wrong}]);
 await assert.rejects(pg.list('order_items'),/Cross-tenant/);
 await assert.rejects(rest.list('order_items'),/Unexpected tenant data response/);
});
