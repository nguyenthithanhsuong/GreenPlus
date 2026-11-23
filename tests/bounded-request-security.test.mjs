import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {apiFailure,readBoundedJson} from '../packages/ai-core/response.mjs';

const url='https://greenplus.example/api/support/inquiries';
const json=(value,opts={})=>new Request(url,{method:'POST',headers:{'content-type':'application/json',...(opts.headers||{})},body:typeof value==='string'?value:JSON.stringify(value)});
const expectStatus=async(request,status,options)=>{
  await assert.rejects(readBoundedJson(request,options),error=>{
    assert.equal(error.status,status);
    assert.equal(apiFailure(error).status,status);
    return true;
  });
};

test('accepts valid JSON object and UTF-8 under the byte cap',async()=>{
  const result=await readBoundedJson(json({subject:'Giao hàng 🌱',storeId:'abc'}));
  assert.deepEqual(result,{subject:'Giao hàng 🌱',storeId:'abc'});
});

test('rejects missing body, invalid JSON, arrays and invalid UTF-8',async()=>{
  await expectStatus(new Request(url,{method:'POST',headers:{'content-type':'application/json'}}),400);
  await expectStatus(json('{"broken":'),400);
  await expectStatus(json([]),400);
  await expectStatus(json('null'),400);
  await expectStatus(new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:new Uint8Array([0xff,0xfe])}),400);
});

test('checks actual streamed byte count even if content length is absent or spoofed',async()=>{
  const oversize='a'.repeat(32768);
  await expectStatus(json({subject:oversize}),413);
  const stream=new ReadableStream({
    start(controller){ controller.enqueue(new TextEncoder().encode('{"data":"')); controller.enqueue(new TextEncoder().encode('x'.repeat(40000))); controller.close(); },
  });
  const request=new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:stream,duplex:'half'});
  await expectStatus(request,413);
  await expectStatus(json({subject:'abc'},{headers:{'content-length':'33000'}}),413);
});

test('rejects cross-origin JSON and unsupported media types before parsing',async()=>{
  await expectStatus(json({subject:'test'},{headers:{origin:'https://evil.example'}}),403);
  await expectStatus(new Request(url,{method:'POST',headers:{'content-type':'text/plain'},body:'{}'}),415);
});

test('every high-risk support/AI submission endpoint uses bounded reader',()=>{
  const root=resolve(import.meta.dirname,'..');
  const paths=[];
  for(const app of ['web-admin','web-client','web-shipper']){
    for(const segment of ['support/inquiries/route.ts','support/inquiries/[inquiryId]/messages/route.ts',
      'support/threads/route.ts','support/threads/[threadId]/messages/route.ts','ai/chat/route.ts']) {
      const path=`${app}/src/app/api/${segment}`;
      const text=readFileSync(resolve(root,path),'utf8');
      assert.match(text,/readBoundedJson\(request\)/,path);
      // A previous Admin route called readBoundedJson without importing it:
      // that passed source-only contract tests but failed TypeScript/Next builds.
      const imports=[...text.matchAll(/import\s*\{[^}]+\}\s*from\s*["'][^"']+["'];?/gs)].map(m=>m[0]);
      assert.ok(imports.some(statement=>/\breadBoundedJson\b/.test(statement)
        && /packages\/ai-core\/response\.mjs/.test(statement)),`${path}: missing bounded reader import`);
      assert.doesNotMatch(text,/request\.json\(\)/,path);
      paths.push(path);
    }
  }
  assert.equal(paths.length,15);
});

test('public sign-in endpoints bound request bodies and credential lengths',()=>{
  const root=resolve(import.meta.dirname,'..');
  for(const app of ['web-admin','web-client','web-shipper']){
    const path=resolve(root,`${app}/src/app/api/auth/sign-in/route.ts`);
    const contents=readFileSync(path,'utf8');
    assert.match(contents,/readBoundedJson\(request,\{maxBytes:8192\}\)/,app);
    assert.match(contents,/254/,app);
    assert.match(contents,/1024/,app);
  }
});

test('support UI never renders stale messages from an earlier selected store',()=>{
  const root=resolve(import.meta.dirname,'..');
  const source=readFileSync(resolve(root,'packages/support-ui/LiveSupportView.tsx'),'utf8');
  assert.match(source,/setMessageContext\(key\)/);
  assert.match(source,/messageContext===currentMessageKey\?messages:\[\]/);
  assert.match(source,/nearBottom\.current/);
});
