import test from 'node:test';import assert from 'node:assert/strict';
import {readAuthorizedOrderStatus} from '../packages/ai-core/order-insights.mjs';
const store='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const user='33333333-3333-4333-8333-333333333333';
const shipper='44444444-4444-4444-8444-444444444444';
const order='55555555-5555-4555-8555-555555555555';
const actor=(role='customer',userId=user)=>({storeId:store,userId,role});
function fakeDb({owner=user,store_id=store,assigned=shipper,status='delivering'}={}) {
 const calls=[];
 const db={from(table){const filters=[];const q={
   select(fields){calls.push({table,fields});return q;},
   eq(key,value){filters.push([key,value]);return q;},
   async maybeSingle(){let row=table==='orders'?{order_id:order,user_id:owner,store_id,status}:{order_id:order,employee_id:assigned,store_id};
     return {data:filters.every(([k,v])=>row[k]===v)?row:null,error:null};}
 };return q;}};return {db,calls};
}
test('high-mode order tool answers only validated store/customer order',async()=>{
 const f=fakeDb();const answer=await readAuthorizedOrderStatus(f.db,actor(),`Đơn ${order} đang giao tới đâu?`);
 assert.equal(answer.mode,'authorized_order_lookup');assert.match(answer.answer,/đang được giao/);
 assert.ok(f.calls.some(q=>q.table==='orders' && q.fields==='order_id,store_id,user_id,status'));
 const wrong=fakeDb({owner:shipper});const denied=await readAuthorizedOrderStatus(wrong.db,actor(),`Theo dõi đơn ${order}`);
 assert.match(denied.answer,/Không tìm thấy/);
 const tenant=fakeDb({store_id:other});const isolated=await readAuthorizedOrderStatus(tenant.db,actor(),`Theo dõi đơn ${order}`);
 assert.match(isolated.answer,/Không tìm thấy/);
});
test('shipper must be assigned, guest/administrator do not receive order data',async()=>{
 const f=fakeDb();
 const allowed=await readAuthorizedOrderStatus(f.db,actor('shipper',shipper),`order ${order} status?`,'en');
 assert.match(allowed.answer,/out for delivery/);
 const denied=await readAuthorizedOrderStatus(f.db,actor('shipper',user),`order ${order} status?`);
 assert.match(denied.answer,/Không tìm thấy/);
 assert.match((await readAuthorizedOrderStatus(f.db,actor('admin'),`order ${order} status?`)).answer,/Không tìm thấy/);
});
test('no order id gets safe prompt; unrelated questions do not call DB',async()=>{
 const f=fakeDb();
 assert.match((await readAuthorizedOrderStatus(f.db,actor(),'Tình trạng đơn hàng của tôi?')).answer,/Vui lòng cung cấp/);
 assert.equal(await readAuthorizedOrderStatus(f.db,actor(),'Cửa hàng mở lúc mấy giờ?'),null);
 assert.equal(await readAuthorizedOrderStatus(f.db,actor(),'Chính sách hủy đơn hàng như thế nào?'),null);
 assert.equal(await readAuthorizedOrderStatus(f.db,actor(),'Phí giao hàng tính ra sao?'),null);
 assert.equal(f.calls.length,0);
});
