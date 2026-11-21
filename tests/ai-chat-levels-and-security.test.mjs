import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chatPreferences} from '../packages/ai-core/chat-levels.mjs';
import {chatMsg} from '../packages/ai-core/MSG.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('levels and locale reject invalid values at server boundary',()=>{
  for(const level of ['low','medium','high']) assert.deepEqual(chatPreferences(level,'vi'),{level,locale:'vi'});
  assert.throws(()=>chatPreferences('owner'),/Mức trợ lý không hợp lệ/);
  assert.throws(()=>chatPreferences('high','xyz'),/Ngôn ngữ không hợp lệ/);
});
test('three chat clients send selected level and locale to authenticated API',()=>{
  for(const p of ['web-admin/frontend/ai/AiChat.tsx','web-client/frontend/ai/AiChat.tsx','web-shipper/src/frontend/ai/ShipperAiChat.tsx']){
    const src=read(p); assert.match(src,/level,\s*locale/); assert.match(src,/chatMsg\(/);
  }
});
test('route keeps authorization and forwards level to service',()=>{
  assert.match(read('web-admin/backend/modules/ai-assist/chat.ts'),/\.\.\.preferences/);
  assert.match(read('packages/ai-core/chat-server.mjs'),/\.\.\.preferences/);
  for(const p of ['web-admin/src/app/api/ai/chat/route.ts','web-client/src/app/api/ai/chat/route.ts','web-shipper/src/app/api/ai/chat/route.ts']){
    const src=read(p); assert.match(src,/body\.level|value\.level/);
  }
});
test('static messages support English and Vietnamese',()=>{
 assert.match(chatMsg('en','low'),/Low/);assert.match(chatMsg('vi','low'),/Thấp/);
});
test('unexpected errors are not returned verbatim in client API',()=>{
 const src=read('web-client/src/lib/with-sentry.ts');
 assert.doesNotMatch(src,/toErrorMessage\(error\)|console\.error\([^)]*error/);
});

test('client and shipper normalize untrusted AI level and locale before typed service call',()=>{
  for(const p of ['web-client/src/app/api/ai/chat/route.ts','web-shipper/src/app/api/ai/chat/route.ts']) {
    const src=read(p);
    assert.match(src,/import \{ chatPreferences \} from ["'][^"']+chat-levels\.mjs["']/);
    assert.match(src,/chatPreferences\(body\.level,body\.locale\)/);
    assert.match(src,/askStoreChat\([^;]*body\.conversationId,level,locale\)/);
    assert.doesNotMatch(src,/body\.conversationId,body\.level,body\.locale/);
  }
  for(const invalid of ['superadmin','',42,null,{},[]]) {
    assert.throws(()=>chatPreferences(invalid,'vi'),/Mức trợ lý không hợp lệ/);
  }
  assert.deepEqual(chatPreferences(undefined,undefined),{level:'low',locale:'vi'});
});
