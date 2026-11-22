import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {parseArguments,runSystemSmoke} from '../../scripts/testing/system-smoke.mjs';
async function withServer(handler,callback){
 const server=createServer(handler);server.listen(0,'127.0.0.1');await once(server,'listening');
 try{return await callback(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise((ok,fail)=>server.close(err=>err?fail(err):ok()));}
}
const handler=(req,res)=>{
 if(req.url==='/api/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'ok'}));return;}
 if(req.url==='/login'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<html>Login</html>');return;}
 if(['/api/auth/me','/api/shipper/deliveries','/api/support/inquiries'].includes(req.url)){res.writeHead(401);res.end('unauthorized');return;}
 res.writeHead(404);res.end('missing');
};
test('system smoke probes three app origins, health schema and unauthenticated boundaries through real HTTP',async()=>{
 await withServer(handler, async origin=>{
  const settings=parseArguments(['--admin',`${origin}/`,'--client',`${origin}/`,'--shipper',`${origin}/`]);
  const report=await runSystemSmoke(settings);
  assert.equal(report.total,11);assert.equal(report.passed,11);assert.equal(report.failed,0);
  assert.ok(report.checks.every(c=>c.latencyMs>=0));
 });
});
test('smoke rejects remote insecure origins and URLs containing credentials',()=>{
 assert.throws(()=>parseArguments(['--client','https://example.org']),/Remote smoke/);
 assert.throws(()=>parseArguments(['--allow-remote','--client','http://example.org']),/HTTPS/);
 assert.throws(()=>parseArguments(['--allow-remote','--client','https://user:secret@example.org']),/Invalid smoke/);
});
test('smoke fails closed when the real HTTP health schema or auth boundary is wrong',async()=>{
 await withServer((req,res)=>{
  if(req.url==='/api/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'error'}));}
  else{res.writeHead(200);res.end('unsafe');}
 },async origin=>{
  const settings=parseArguments(['--admin',origin,'--client',origin,'--shipper',origin]);
  const report=await runSystemSmoke(settings);
  assert.equal(report.failed,8);
 });
});
test('smoke never transmits credentials or performs mutations',async()=>{
 const seen=[];
 await withServer((req,res)=>{seen.push({method:req.method,headers:req.headers});handler(req,res);},async origin=>{
  const settings=parseArguments(['--admin',origin,'--client',origin,'--shipper',origin]);
  await runSystemSmoke(settings);
 });
 assert.equal(seen.length,11);assert.ok(seen.every(x=>x.method==='GET'&&!x.headers.authorization&&!x.headers.cookie));
});
