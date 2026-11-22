import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {readBoundedJson,apiFailure} from '../../packages/ai-core/response.mjs';

test('HTTP integration: streamed JSON under/over threshold, same-origin checks, bad JSON',async(t)=>{
  const server=createServer(async(req,res)=>{
    const path=`http://127.0.0.1:${server.address().port}${req.url}`;
    try{
      const request=new Request(path,{method:req.method,headers:req.headers,
        body:Readable.toWeb(req),duplex:'half'});
      const data=await readBoundedJson(request,{maxBytes:1024});
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({value:data.message}));
    }catch(error){
      const response=apiFailure(error);
      res.writeHead(response.status,{'content-type':'application/json'});
      res.end(await response.text());
    }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const address=`http://127.0.0.1:${server.address().port}/chat`;
  const good=await fetch(address,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'Xin chào'})});
  assert.equal(good.status,200);
  assert.deepEqual(await good.json(),{value:'Xin chào'});
  const over=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{"message":"'));controller.enqueue(new TextEncoder().encode('x'.repeat(4096)));controller.close();}});
  const tooBig=await fetch(address,{method:'POST',headers:{'content-type':'application/json'},body:over,duplex:'half'});
  assert.equal(tooBig.status,413);
  const cross=await fetch(address,{method:'POST',headers:{'content-type':'application/json',origin:'https://attacker.invalid'},body:'{}'});
  assert.equal(cross.status,403);
  const broken=await fetch(address,{method:'POST',headers:{'content-type':'application/json'},body:'{"message":'});
  assert.equal(broken.status,400);
});
