import test from 'node:test';
import assert from 'node:assert/strict';
import {callAiService} from '../packages/ai-core/ai-client.mjs';
import {serverlessChat,serverlessRecipes,serverlessForecast,serverlessPromotion,serverlessComplaints} from '../packages/ai-core/serverless-ai.mjs';
const store_id='11111111-1111-4111-8111-111111111111', product_id='22222222-2222-4222-8222-222222222222';
const base={store_id,role:'customer',level:'low',locale:'vi',question:'Đổi trả hàng như thế nào?',knowledge:[{id:'k1',question:'Đổi trả hàng như thế nào?',answer:'Liên hệ cửa hàng trong vòng 7 ngày.'}]};
test('FAQ low and medium are deterministic and store-scoped',async()=>{
 const low=await serverlessChat(base); assert.equal(low.mode,'retrieval');assert.deepEqual(low.sources,['k1']);
 const med=await serverlessChat({...base,level:'medium'});assert.equal(med.mode,'rag_serverless');assert.match(med.answer,/7 ngày/);
 const miss=await serverlessChat({...base,question:'Giờ mở cửa cửa hàng vào thứ bảy?'});assert.equal(miss.handoff,true);assert.deepEqual(miss.sources,[]);
});
test('online high never invents or leaks unapproved price/URL',async()=>{
 const old={AI_LLM_URL:process.env.AI_LLM_URL,AI_LLM_KEY:process.env.AI_LLM_KEY,AI_LLM_MODEL:process.env.AI_LLM_MODEL};
 try{
 process.env.AI_LLM_URL='https://api.example.test/v1/chat/completions';process.env.AI_LLM_KEY='fake-key';process.env.AI_LLM_MODEL='fake';
 const fake=async()=>({ok:true,json:async()=>({choices:[{message:{content:'Khách trả phí 2000 đồng.'}}]})});
 const denied=await serverlessChat({...base,level:'high'},{fetchImpl:fake});assert.equal(denied.degraded,true);assert.equal(denied.answer,base.knowledge[0].answer);
 const ok=await serverlessChat({...base,level:'high'},{fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:'Bạn có thể liên hệ cửa hàng trong vòng 7 ngày.'}}]})})});
 assert.equal(ok.degraded,false);assert.equal(ok.mode,'hybrid_rag_llm');
 } finally {for(const [k,v] of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('chat provider environment is not needed in Vercel serverless mode',async()=>{
 const old=process.env.GREENPLUS_AI_RUNTIME;process.env.GREENPLUS_AI_RUNTIME='serverless';
 try{const answer=await callAiService('chat',base);assert.equal(answer.mode,'retrieval');}finally{if(old===undefined)delete process.env.GREENPLUS_AI_RUNTIME;else process.env.GREENPLUS_AI_RUNTIME=old;}
});
test('serverless recipes and complaints require bounded store id',()=>{
 assert.equal(serverlessRecipes({store_id,ingredients:['cà rốt','khoai tây'],servings:2}).recipes.length,3);
 assert.equal(serverlessComplaints({store_id,text:'Tôi bị dị ứng với món ăn'}).priority,'high');
 assert.throws(()=>serverlessRecipes({store_id:'xxx',ingredients:['rau'],servings:2}));
});
test('forecast is clearly labelled low-confidence heuristic, promotions require approval',()=>{
 const forecast=serverlessForecast({store_id,items:[{product_id,name:'Rau',available:6,history:[{day:'2026-11-01',quantity:2}]}],as_of:'2026-11-22'});
 assert.equal(forecast.items[0].model_version,'moving-median-serverless-v1'); assert.equal(forecast.items[0].confidence,'low');
 const promo=serverlessPromotion({store_id,product_id,available:10,expiry_days:2,daily_demand:1,confidence:'low'});
 assert.equal(promo.approval_required,true);assert.equal(promo.suggested_discount_pct,25);
});

test('free external model does not receive contact details from question or FAQ',async()=>{
 const old={AI_LLM_URL:process.env.AI_LLM_URL,AI_LLM_KEY:process.env.AI_LLM_KEY,AI_LLM_MODEL:process.env.AI_LLM_MODEL};
 try {
  process.env.AI_LLM_URL='https://api.example.test/v1/chat/completions';process.env.AI_LLM_KEY='fake';process.env.AI_LLM_MODEL='fake';
  let called=false; const fetchImpl=async()=>{called=true;throw Error('Must not contact provider');};
  const question=await serverlessChat({...base,level:'high',question:'Đổi trả hàng như thế nào? Email tôi là a@example.com'},{fetchImpl});
  assert.equal(question.degraded,true);assert.equal(called,false);
  const faq=await serverlessChat({...base,level:'high',knowledge:[{...base.knowledge[0],answer:'Liên hệ 0901234567 để đổi trả'}]},{fetchImpl});
  assert.equal(faq.degraded,true);assert.equal(called,false);
 }finally{for(const [k,v] of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
