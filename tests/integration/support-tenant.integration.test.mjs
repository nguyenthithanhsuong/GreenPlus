import test from 'node:test';
import assert from 'node:assert/strict';
import {getThread,sendMessage,SupportError} from '../../packages/ai-core/support-server.mjs';
const a='11111111-1111-4111-8111-111111111111';
const b='22222222-2222-4222-8222-222222222222';
const t='33333333-3333-4333-8333-333333333333';
const customer='44444444-4444-4444-8444-444444444444';
const other='55555555-5555-4555-8555-555555555555';
const order='66666666-6666-4666-8666-666666666666';
/** Contract-accurate asynchronous PostgREST chain, no database or network dependencies. */
function fakeDatabase(rows={}){
 const mutations=[];
 const db={rpc:async(name,args)=>({data:true,error:null}),from(table){
  const clauses=[];let action='select';let payload=null;
  const q={
   select(){return q;},eq(key,value){clauses.push([key,value]);return q;},
   update(value){action='update';payload=value;return q;},insert(value){action='insert';payload=value;return q;},
   order(){return q;},limit(){return q;},single(){return execute(true);},maybeSingle(){return execute(true);},
   then(ok,fail){return execute(false).then(ok,fail);}
  };
  function execute(one){
   const scoped=(rows[table]??[]).filter(row=>clauses.every(([k,v])=>row[k]===v));
   if(action==='insert'){
    mutations.push({table,payload});return Promise.resolve({data:{id:'77777777-7777-4777-8777-777777777777',...payload},error:null});
   }
   if(action==='update'){
    for(const row of scoped)Object.assign(row,payload);
    mutations.push({table,payload});
   }
   return Promise.resolve({data:one?(scoped[0]??null):scoped,error:null});
  }
  return q;
 }};return {db,mutations};
}
const thread={id:t,store_id:a,order_id:order,customer_id:customer,shipper_id:null,status:'open',is_escalated:false};
test('customer can read own store thread; cross-store and other customer are denied',async()=>{
 const {db}=fakeDatabase({support_threads:[{...thread}]});
 const allowed=await getThread(db,{storeIds:[a],role:'customer',userId:customer},t);
 assert.equal(allowed.id,t);
 await assert.rejects(()=>getThread(db,{storeIds:[b],role:'customer',userId:customer},t),e=>e.status===404);
 await assert.rejects(()=>getThread(db,{storeIds:[a],role:'customer',userId:other},t),e=>e.status===403);
});
test('admin must only read escalated threads; manager reads scoped store',async()=>{
 const {db}=fakeDatabase({support_threads:[{...thread}]});
 await assert.rejects(()=>getThread(db,{storeIds:[a],role:'admin',userId:other},t),e=>e.status===403);
 assert.equal((await getThread(db,{storeIds:[a],role:'manager',userId:other},t)).id,t);
});
test('support messages cannot be sent by outsiders or to closed threads',async()=>{
 const record={...thread};const {db,mutations}=fakeDatabase({support_threads:[record]});
 await assert.rejects(()=>sendMessage(db,{storeIds:[a],role:'customer',userId:other},t,'Hello'),e=>e.status===403);
 await assert.rejects(()=>sendMessage(db,{storeIds:[b],role:'manager',userId:other},t,'Hello'),e=>e.status===404);
 assert.equal(mutations.length,0);
 const inserted=await sendMessage(db,{storeIds:[a],role:'customer',userId:customer},t,'Xin hỗ trợ');
 assert.equal(inserted.body,'Xin hỗ trợ');
 assert.equal(mutations.length,1);
 assert.equal(mutations[0].payload.store_id,a);
 record.status='closed';
 await assert.rejects(()=>sendMessage(db,{storeIds:[a],role:'customer',userId:customer},t,'Late message'),e=>e.status===409);
 assert.equal(mutations.length,1);
});
test('invalid thread UUID is rejected before DB access',async()=>{
 const {db,mutations}=fakeDatabase({support_threads:[{...thread}]});
 await assert.rejects(()=>getThread(db,{storeIds:[a],role:'manager',userId:other},'../admin'),SupportError);
 assert.equal(mutations.length,0);
});
