import test from 'node:test';
import assert from 'node:assert/strict';
import {listInquiries,getInquiry,startInquiry,listInquiryMessages,sendInquiryMessage,resolveInquiry,escalateInquiry} from '../packages/ai-core/general-support.mjs';
const a='11111111-1111-4111-8111-111111111111';
const b='22222222-2222-4222-8222-222222222222';
const customer='33333333-3333-4333-8333-333333333333';
const another='44444444-4444-4444-8444-444444444444';
const manager='55555555-5555-4555-8555-555555555555';
const threadId='66666666-6666-4666-8666-666666666666';
const actor=(userId,role,storeId=a)=>({userId,role,storeIds:[storeId]});
function dbFixture(){
 const rows={support_inquiries:[{id:threadId,store_id:a,created_by:customer,subject:'Nhận tư vấn',status:'open',is_escalated:false,created_at:'2026-11-22T00:00:00Z'}],support_inquiry_messages:[]};
 const calls=[];let denyQuota=false;
 const db={
  rpc:async(name,args)=>{calls.push({name,args});return {data:!denyQuota,error:null};},
  from(table){
   const conditions=[];let mutation='read',data=null;
   const q={
    eq(key,value){conditions.push([key,value]);return q;},order(){return q;},limit(){return q;},
    select(){return q;},insert(v){mutation='insert';data=v;return q;},update(v){mutation='update';data=v;return q;},
    single(){return execute(true);},maybeSingle(){return execute(true);},
    then(ok,fail){return execute(false).then(ok,fail);},
   };
   async function execute(single){
    let matched=(rows[table]??[]).filter(row=>conditions.every(([k,v])=>row[k]===v));
    if(mutation==='insert'){
     const row={id:table==='support_inquiries'?another:threadId,created_at:new Date().toISOString(),...data};
     rows[table].push(row); matched=[row];
    }
    if(mutation==='update'){for(const row of matched)Object.assign(row,data);}
    return {data:single?(matched[0]??null):matched,error:null};
   }
   return q;
  }
 };
 return {db,rows,calls,deny:()=>{denyQuota=true;}};
}
test('customer sees only own inquiry, cross-store and other customer blocked',async()=>{
 const {db}=dbFixture();
 assert.equal((await getInquiry(db,actor(customer,'customer'),threadId)).id,threadId);
 await assert.rejects(()=>getInquiry(db,actor(customer,'customer',b),threadId),e=>e.status===404);
 await assert.rejects(()=>getInquiry(db,actor(another,'customer'),threadId),e=>e.status===403);
 assert.equal((await listInquiries(db,actor(another,'customer'))).length,0);
 assert.equal((await listInquiries(db,actor(manager,'manager'))).length,1);
 assert.equal((await listInquiries(db,actor(manager,'admin'))).length,0);
});
test('new inquiries require a validated subject, user membership and atomic quota',async()=>{
 const f=dbFixture();
 await assert.rejects(()=>startInquiry(f.db,actor(customer,'customer'),'hi'),e=>e.status===400);
 const r=await startInquiry(f.db,actor(customer,'customer'),'  Hỏi về cửa hàng  ');
 assert.equal(r.subject,'Hỏi về cửa hàng');
 assert.equal(f.calls.at(-1).args.p_action,'support.inquiry');
 f.deny();await assert.rejects(()=>startInquiry(f.db,actor(customer,'customer'),'More questions'),e=>e.status===429);
});
test('messages validate permission before quota, and reject closed thread / spam',async()=>{
 const f=dbFixture();
 await assert.rejects(()=>sendInquiryMessage(f.db,actor(another,'customer'),threadId,'hello'),e=>e.status===403);
 assert.equal(f.calls.length,0);
 const message=await sendInquiryMessage(f.db,actor(customer,'customer'),threadId,'Xin chào');
 assert.equal(message.body,'Xin chào');
 assert.equal(f.calls[0].args.p_action,'support.message');
 assert.equal((await listInquiryMessages(f.db,actor(customer,'customer'),threadId)).length,1);
 f.deny();await assert.rejects(()=>sendInquiryMessage(f.db,actor(customer,'customer'),threadId,'spam'),e=>e.status===429);
 await assert.rejects(()=>resolveInquiry(f.db,actor(customer,'customer'),threadId),e=>e.status===403);
 assert.equal((await resolveInquiry(f.db,actor(manager,'manager'),threadId)).status,'resolved');
 await assert.rejects(()=>sendInquiryMessage(f.db,actor(customer,'customer'),threadId,'late'),e=>e.status===409);
});

test('manager can escalate, admin sees only escalated threads in same store',async()=>{
 const f=dbFixture();
 await assert.rejects(()=>escalateInquiry(f.db,actor(customer,'customer'),threadId),e=>e.status===403);
 assert.equal((await listInquiries(f.db,actor(manager,'admin'))).length,0);
 assert.equal((await escalateInquiry(f.db,actor(manager,'manager'),threadId)).is_escalated,true);
 assert.equal((await listInquiries(f.db,actor(manager,'admin'))).length,1);
 assert.equal((await listInquiries(f.db,actor(manager,'admin',b))).length,0);
});
test('message listing uses most recent 150 messages and returns chronological order',async()=>{
 const f=dbFixture();
 const source=await import('node:fs/promises');
 const code=await source.readFile(new URL('../packages/ai-core/general-support.mjs',import.meta.url),'utf8');
 assert.match(code,/\.order\('created_at',\{ascending:false\}\)\.limit\(150\)\)\?\.reverse\(\)/);
 // DB integration tests must additionally confirm ordering on real PostgreSQL.
 assert.equal((await listInquiryMessages(f.db,actor(customer,'customer'),threadId)).length,0);
});
