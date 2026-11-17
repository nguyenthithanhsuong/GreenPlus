import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url),'utf8');

test('Customer and Shipper request only server-verified conversation history, never user-supplied history',()=>{
 const shared=read('packages/ai-core/chat-server.mjs');
 assert.match(shared,/\.eq\("actor_id",actor\.userId\)\.eq\("store_id",actor\.storeId\)/);
 assert.match(shared,/from\("ai_messages"\)\.select\("question,answer"\)/);
 assert.match(shared,/\.limit\(4\)/);
 assert.match(shared,/\.eq\("review_status","approved"\)/);
 assert.match(shared,/history}/);
 for(const url of ['web-client/src/app/api/ai/chat/route.ts','web-shipper/src/app/api/ai/chat/route.ts']){
  assert.match(read(url),/askStoreChat\(/);
  assert.doesNotMatch(read(url),/body\.history/);
 }
});

test('Admin conversations reject unowned ids before reading messages and use only approved FAQ',()=>{
 const code=read('web-admin/backend/modules/ai-assist/chat.ts');
 assert.match(code,/if \(!data\) throw new AiError\("Hội thoại không tồn tại",404\)/);
 assert.match(code,/if \(!owner\) throw new AiError\("Hội thoại không tồn tại",404\)/);
 assert.match(code,/\.eq\("store_id",actor\.storeId\)/);
 assert.match(read('web-admin/backend/modules/ai-assist/knowledge.ts'),/\.eq\("review_status", "approved"\)/);
});

test('Inventory has forecast and warnings, pricing has price-specific AI proposals without copied inventory graphs',()=>{
 const inventory=read('web-admin/frontend/ai/AiOverview.tsx');
 const pricing=read('web-admin/frontend/ai/AiPricingIntelligence.tsx');
 const prices=read('web-admin/frontend/prices/PriceManagement.tsx');
 assert.match(inventory,/Cơ cấu cảnh báo tồn kho/);
 assert.match(inventory,/Dự kiến hết hàng/);
 assert.doesNotMatch(inventory,/Đề xuất khuyến mãi<\/h/);
 assert.match(pricing,/Mức giảm duyệt/);
 assert.match(pricing,/Duyệt/);assert.match(pricing,/Từ chối/);
 assert.doesNotMatch(pricing,/Cơ cấu cảnh báo tồn kho/);
 assert.match(prices,/AiPricingIntelligence/);
 assert.match(prices,/if \(tab === "forecast"\) setActiveTab\("suggestions"\)/);
});

test('All three chats hide misleading similarity score for greetings and fallback',()=>{
 for(const file of ['web-admin/frontend/ai/AiChat.tsx','web-client/frontend/ai/AiChat.tsx','web-shipper/src/frontend/ai/ShipperAiChat.tsx']){
  const content=read(file);
  assert.doesNotMatch(content,/Mức khớp:|độ khớp|Độ khớp/);
  assert.match(content,/hybrid_rag_llm/);
 }
});
