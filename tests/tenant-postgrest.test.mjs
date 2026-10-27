import test from 'node:test';
import assert from 'node:assert/strict';
import { guardPostgrestRequest } from '../web-admin/backend/core/tenant-postgrest.mjs';
const scope={storeIds:['store-a']};
const base='https://example.supabase.co/rest/v1/';
test('read by service role is scoped at database transport',()=>{
 const {url}=guardPostgrestRequest(base+'products?select=*',{},scope);
 assert.equal(new URL(url).searchParams.get('store_id'),'in.(store-a)');
});
test('updates/deletes include server-derived store filter',()=>{
 for(const method of ['PATCH','DELETE']){
  const {url}=guardPostgrestRequest(base+'orders?order_id=eq.X',{method,body:method==='PATCH'?'{"status":"confirmed"}':undefined},scope);
  assert.equal(new URL(url).searchParams.get('store_id'),'in.(store-a)');
 }
});
test('foreign store insert is forbidden and missing store is assigned',()=>{
 assert.throws(()=>guardPostgrestRequest(base+'products',{method:'POST',body:'{"store_id":"store-b"}'},scope),/Invalid insert store/);
 const x=guardPostgrestRequest(base+'products',{method:'POST',body:'{"name":"ABC"}'},scope);
 assert.equal(JSON.parse(x.init.body).store_id,'store-a');
});
test('tenant ownership is immutable and updates cannot upsert',()=>{
 assert.throws(()=>guardPostgrestRequest(base+'orders',{method:'PATCH',body:'{"store_id":"store-b"}'},scope),/Cannot change store/);
 assert.throws(()=>guardPostgrestRequest(base+'orders',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:'{"store_id":"store-a"}'},scope),/Unsafe tenant upsert/);
});
test('unscoped admin and unrelated public metadata remain unchanged',()=>{
 assert.equal(guardPostgrestRequest(base+'products',{},null).url,base+'products');
 assert.equal(guardPostgrestRequest(base+'roles',{},scope).url,base+'roles');
});

test('multi-store actors can only read their authorized stores and cannot silently insert to an arbitrary store',()=>{
 const multiple={storeIds:['store-a','store-b']};
 const read=guardPostgrestRequest(base+'orders',{method:'GET'},multiple);
 assert.equal(new URL(read.url).searchParams.get('store_id'),'in.(store-a,store-b)');
 assert.throws(()=>guardPostgrestRequest(base+'orders',{method:'POST',body:'{"order_id":"X"}'},multiple),/Invalid insert store/);
});
