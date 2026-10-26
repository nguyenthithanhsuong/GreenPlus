import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from 'node:http';import {once} from 'node:events';
import {makeDeliveryApi,DeliveryApiError} from '../src/lib/delivery-api.mjs';
const row={order_id:'abc-1',delivery_id:'d-1',status:'assigned',customer_name:'Khách',delivery_address:'HCM',total_amount:100};
test('integration: bearer forwarded and response validated',async()=>{
 const server=createServer(async(req,res)=>{assert.equal(req.headers.authorization,'Bearer example');res.setHeader('content-type','application/json');if(req.method==='PATCH'){let body='';for await(const c of req)body+=c;assert.equal(JSON.parse(body).status,'picked_up');res.end(JSON.stringify({...row,status:'picked_up'}));}else res.end(JSON.stringify({items:[row]}));});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{const api=makeDeliveryApi({baseUrl:`http://127.0.0.1:${server.address().port}`});assert.equal((await api.list('Bearer example'))[0].order_id,'abc-1');assert.equal((await api.update('Bearer example','abc-1','assigned','picked_up')).status,'picked_up');await assert.rejects(api.list(null),e=>e instanceof DeliveryApiError&&e.status===401);await assert.rejects(api.update('Bearer example','../bad','assigned','picked_up'),e=>e.status===400);}finally{server.close();await once(server,'close');}
});
