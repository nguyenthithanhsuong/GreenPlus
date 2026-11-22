import test from 'node:test';import assert from 'node:assert/strict';
import {createTenantPostgresAdapter} from '../packages/tenant-routing/postgres-adapter.mjs';
const store='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const id='33333333-3333-4333-8333-333333333333';
function make(reply){const calls=[];const pool={async query(sql,values){calls.push({sql,values});return {rows:typeof reply==='function'?reply(sql,values):reply};}};return {adapter:createTenantPostgresAdapter({route:{storeId:store,schema:'public'},pool}),calls};}
test('SQL values are parameters, list pagination validates bounds',async()=>{
 const {adapter,calls}=make([{store_id:store,product_id:id,name:'An toàn'}]);
 assert.equal((await adapter.find('products',id)).product_id,id);
 assert.ok(calls[0].sql.includes('store_id=$1'));
 assert.deepEqual(calls[0].values,[store,id]);
 assert.equal((await adapter.list('products',{limit:2,offset:3})).length,1);
 assert.deepEqual(calls[1].values,[store,2,3]);
 await assert.rejects(()=>adapter.list('products',{limit:10000}),/pagination/);
 await assert.rejects(()=>adapter.find('products',`' OR 1=1--`),/identifier/);
 await assert.rejects(()=>adapter.list('users'),/Unsupported/);
});
test('Writes cannot change tenant or inject SQL column names',async()=>{
 const {adapter,calls}=make([{store_id:store,product_id:id}]);
 await adapter.insert('products',{name:"Green' OR 1=1--"});
 assert.ok(!calls[0].sql.includes('OR 1=1'));
 assert.ok(calls[0].values.includes("Green' OR 1=1--"));
 await adapter.update('products',id,{name:'New name'});
 assert.ok(calls[1].sql.includes('store_id=$1'));
 await assert.rejects(()=>adapter.insert('products',{name:'test',store_id:other}),/ownership/);
 await assert.rejects(()=>adapter.update('products',id,{store_id:store}),/ownership/);
 await assert.rejects(()=>adapter.update('products',id,{'name;DROP TABLE users':'bad'}),/Unsupported write/);
});
test('Fail closed on cross tenant database response or unavailable pool',async()=>{
 const {adapter}=make([{store_id:other,product_id:id}]);
 await assert.rejects(()=>adapter.list('categories'),/Cross-tenant/);
 assert.throws(()=>createTenantPostgresAdapter({route:{storeId:store,schema:'public;DROP TABLE users'},pool:{query(){}}}),/Unresolved/);
 assert.throws(()=>createTenantPostgresAdapter({route:{storeId:store,schema:'public'},pool:null}),/Unresolved/);
});
