import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTenantPostgresAdapter,TENANT_READ_TABLES} from '../packages/tenant-routing/postgres-adapter.mjs';
const store='11111111-1111-4111-8111-111111111111';
const foreign='22222222-2222-4222-8222-222222222222';
const id='33333333-3333-4333-8333-333333333333';
const baseline=readFileSync(new URL('../supabase/migrations/0001_baseline_greenplus.sql',import.meta.url),'utf8');
const tenant=readFileSync(new URL('../supabase/migrations/0005_add_store_scope.sql',import.meta.url),'utf8');
function pg(rows){const queries=[];const pool={async query(sql,values){queries.push({sql,values});return{rows};}};return{adapter:createTenantPostgresAdapter({route:{storeId:store,schema:'public'},pool}),queries};}
test('all read-only tenant ports refer to real store-scoped tables and primary keys',()=>{
  assert.equal(Object.keys(TENANT_READ_TABLES).length,21);
  for(const [table,{id:key}] of Object.entries(TENANT_READ_TABLES)){
    assert.match(baseline,new RegExp(`CREATE TABLE IF NOT EXISTS "public"\\."${table}" \\(`));
    assert.match(tenant,new RegExp(`ALTER TABLE public\\.${table} ADD COLUMN IF NOT EXISTS store_id uuid`));
    const start=baseline.indexOf(`CREATE TABLE IF NOT EXISTS "public"."${table}" (`);
    const end=baseline.indexOf('\n);',start);
    assert.ok(start>=0 && end>start,table);
    assert.ok(baseline.slice(start,end).includes(`"${key}"`),`${table}: ${key}`);
  }
});
test('all tables enforce SQL-bound tenant and ID on reads and block writes',async()=>{
  for(const table of Object.keys(TENANT_READ_TABLES)){
    const {adapter,queries}=pg([{store_id:store}]);
    assert.equal((await adapter.list(table,{limit:2,offset:1})).length,1);
    assert.deepEqual(queries[0].values,[store,2,1]);
    assert.match(queries[0].sql,/WHERE store_id=\$1/);
    assert.match(queries[0].sql,/LIMIT \$2 OFFSET \$3/);
    await adapter.find(table,id);
    assert.deepEqual(queries[1].values,[store,id]);
    if(!['products','categories'].includes(table)){
      await assert.rejects(adapter.update(table,id,{status:'paid'}),/dedicated validated domain/);
      await assert.rejects(adapter.insert(table,{name:'X'}),/dedicated validated domain/);
      await assert.rejects(adapter.delete(table,id),/dedicated validated domain/);
    }
  }
});
test('cross-tenant read results fail closed including payment and order data',async()=>{
  const {adapter}=pg([{store_id:foreign}]);
  await assert.rejects(adapter.list('payments'),/Cross-tenant/);
  await assert.rejects(adapter.find('orders',id),/Cross-tenant/);
});
