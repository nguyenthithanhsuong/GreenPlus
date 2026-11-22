import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {parsePerformanceArguments,runPerformanceSmoke} from '../../scripts/testing/performance-smoke.mjs';
async function withServer(handler,fn){
 const server=createServer(handler);server.listen(0,'127.0.0.1');await once(server,'listening');
 try {return await fn(`http://127.0.0.1:${server.address().port}`);} finally {
  await new Promise((ok,fail)=>server.close(err=>err?fail(err):ok()));
 }
}
test('performance smoke only sends bounded sequential health GETs, never credentials',async()=>{
 const observed=[];
 await withServer((req,res)=>{
  observed.push({path:req.url,method:req.method,auth:req.headers.authorization,cookie:req.headers.cookie});
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'ok'}));
 },async base=>{
  const settings=parsePerformanceArguments(['--samples','3','--admin',base,'--client',base,'--shipper',base]);
  const report=await runPerformanceSmoke(settings);
  assert.equal(report.pass,true);assert.equal(report.details.length,3);
  assert.ok(report.details.every(r=>r.samples===3&&r.failures===0&&r.p95Ms>=r.p50Ms));
 });
 assert.equal(observed.length,9);
 assert.ok(observed.every(r=>r.path==='/api/health'&&r.method==='GET'&&!r.auth&&!r.cookie));
});
test('performance smoke rejects flood size and remote non-TLS',()=>{
 assert.throws(()=>parsePerformanceArguments(['--samples','1000']),/samples/);
 assert.throws(()=>parsePerformanceArguments(['--samples','9','--allow-remote','--client','https://staging.example.org']),/limited/);
 assert.throws(()=>parsePerformanceArguments(['--allow-remote','--client','http://staging.example.org']),/HTTPS/);
});
test('performance smoke marks bad health responses as failures instead of omitting them',async()=>{
 await withServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end('{"status":"down"}');},async base=>{
  const settings=parsePerformanceArguments(['--samples','2','--admin',base,'--client',base,'--shipper',base]);
  const report=await runPerformanceSmoke(settings);
  assert.equal(report.pass,false);assert.ok(report.details.every(r=>r.failures===2));
 });
});
