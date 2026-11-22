import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {callAiService,AiUnavailableError,aiServiceEndpoint} from '../../packages/ai-core/ai-client.mjs';
const key='integration-fixture-not-a-real-secret-1234567890';
async function fixture(callback){
 const requests=[];
 const server=createServer(async(req,res)=>{
  let body='';for await(const part of req)body+=part;
  requests.push({url:req.url,method:req.method,key:req.headers['x-ai-service-key'],body});
  if(req.url==='/v1/chat'){
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({answer:'FAQ đã được duyệt',sources:['faq1'],mode:'retrieval'}));
  } else {res.writeHead(404);res.end('not found');}
 });server.listen(0,'127.0.0.1');await once(server,'listening');
 const prior={runtime:process.env.GREENPLUS_AI_RUNTIME,url:process.env.GREENPLUS_AI_SERVICE_URL,key:process.env.GREENPLUS_AI_SERVICE_KEY,vercel:process.env.VERCEL};
 delete process.env.GREENPLUS_AI_RUNTIME;delete process.env.VERCEL;
 process.env.GREENPLUS_AI_SERVICE_URL=`http://127.0.0.1:${server.address().port}`;process.env.GREENPLUS_AI_SERVICE_KEY=key;
 try{return await callback({requests});}finally{
  for(const [name,value] of Object.entries({GREENPLUS_AI_RUNTIME:prior.runtime,GREENPLUS_AI_SERVICE_URL:prior.url,GREENPLUS_AI_SERVICE_KEY:prior.key,VERCEL:prior.vercel})){
   if(value===undefined)delete process.env[name];else process.env[name]=value;
  }
  await new Promise((ok,fail)=>server.close(err=>err?fail(err):ok()));
 }
}
test('Docker mode sends JSON and its private service key only to the intended localhost AI service',async()=>{
 await fixture(async({requests})=>{
  const result=await callAiService('chat',{question:'Đổi trả hàng?'});
  assert.equal(result.mode,'retrieval');assert.equal(result.sources[0],'faq1');
  assert.equal(requests.length,1);assert.equal(requests[0].url,'/v1/chat');assert.equal(requests[0].method,'POST');
  assert.equal(requests[0].key,key);assert.equal(JSON.parse(requests[0].body).question,'Đổi trả hàng?');
 });
});
test('Docker mode rejects unknown operation and insecure service origins',async()=>{
 await fixture(async()=>{
  await assert.rejects(()=>callAiService('../admin',{}),TypeError);
  process.env.GREENPLUS_AI_SERVICE_URL='http://example.org';
  assert.throws(()=>aiServiceEndpoint(),AiUnavailableError);
 });
});
test('Docker mode reports invalid JSON responses instead of treating them as success',async()=>{
 await fixture(async()=>{
  await assert.rejects(()=>callAiService('forecast',{}),AiUnavailableError);
 });
});
