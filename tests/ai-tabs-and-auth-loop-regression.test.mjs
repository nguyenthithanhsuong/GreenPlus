import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=(name)=>readFileSync(resolve(root,name),'utf8');

test('Inventory still contains original management, transactions and alerts, plus AI forecast tab',()=>{
 const code=read('web-admin/frontend/inventories/InventoryManagement.tsx');
 for(const component of ['InventoryTable','InventoryTransactionTable','InventoryStats','InventoryDrawer','AiAlerts','AiOverview'])assert.match(code,new RegExp(component));
 for(const text of ['Tồn kho hiện tại','Lịch sử giao dịch','Cảnh báo tồn kho','Dự báo & đề xuất AI'])assert.ok(code.includes(text));
});
test('Pricing retains old prices module with separately accessible AI forecast and promotion tabs',()=>{
 const code=read('web-admin/frontend/prices/PriceManagement.tsx');
 for(const text of ['PriceTable','PriceDrawer','AiOverview','AiPromotions','CommerceTabs'])assert.ok(code.includes(text));
 assert.match(code,/currentRole === "manager"/);
});
test('Complaints retain operational UI and embed AI triage with real complaint choice',()=>{
 const code=read('web-admin/frontend/complaints/ComplaintManagement.tsx');
 assert.match(code,/<ComplaintTable/);assert.match(code,/AiTriage embedded complaints=\{complaints\}/);
 const ai=read('web-admin/frontend/ai/AiTriage.tsx');assert.match(ai,/Chọn khiếu nại từ danh sách/);
 assert.match(ai,/role==="manager"/);
});
test('legacy AI route URLs redirect to canonical operational tabs',()=>{
 for(const [path,to] of Object.entries({'ai/promotions':'/prices?tab=promotions','ai/alerts':'/inventories?tab=alerts','ai/complaints':'/complaints?tab=ai'})){
  assert.ok(read(`web-admin/src/app/${path}/page.tsx`).includes(`redirect("${to}")`));
 }
});
test('Docker sandbox explicitly shows AI tabs but does not mix sandbox with Supabase AI data',()=>{
 const src=read('web-admin/frontend/settings/DockerCommerceWorkspace.tsx');
 assert.match(src,/Cảnh báo tồn kho AI/);assert.match(src,/Dự báo & đề xuất AI/);assert.match(src,/chưa có adapter AI hoàn chỉnh/);
 assert.match(src,/AdminShell/);
});
test('admin health performs private service authentication and Supabase AI data checks',()=>{
 const src=read('web-admin/src/app/api/ai/health/route.ts');
 for(const token of ['/health','/v1/complaints','X-AI-Service-Key','ai_knowledge','key_mismatch','database_error']) assert.ok(src.includes(token));
 assert.doesNotMatch(src,/console\.log\(.*secret/);
});
test('client login verifies server session cookie before trusting restored localStorage auth',()=>{
 const src=read('web-client/src/components/auth/auth-screen.tsx');
 assert.match(src,/\/api\/auth\/customer-session/);
 assert.match(src,/response\.status === 401 \|\| response\.status === 403/);
 const route=read('web-client/src/app/api/auth/customer-session/route.ts');
 assert.match(route,/requireCustomerIdentity/); assert.match(route,/status!=="active"/);
});
test('admin guard stays non-blocking after middleware, still logs out on revoked session',()=>{
 const src=read('web-admin/frontend/shared/PageGuard.tsx');
 assert.match(src,/middleware/i); assert.match(src,/clearAuth\(\)/); assert.match(src,/"\/api\/auth\/session"/);
 assert.doesNotMatch(src,/Đang xác minh phiên đăng nhập/);
});
test('AI chat is tenant-bound for client/shipper and resets on store switch',()=>{
 assert.match(read('web-client/frontend/ai/AiChat.tsx'),/STORE_CHANGE_EVENT/);
 assert.match(read('web-admin/frontend/ai/AiChat.tsx'),/\[storeId\]/);
 for(const path of ['web-client/src/app/api/ai/chat/route.ts','web-shipper/src/app/api/ai/chat/route.ts'])assert.match(read(path),/askStoreChat/);
});
test('AI capability policy reserves forecasts and approvals to Manager',async()=>{
 const {canAi}=await import('../packages/ai-core/policy.mjs');
 assert.equal(canAi('employee','forecast.read'),false);
 assert.equal(canAi('employee','promotion.read'),false);
 assert.equal(canAi('employee','promotion.decide'),false);
});
