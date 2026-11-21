import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseKnowledgeCsv,chunkKnowledgeDrafts} from '../packages/ai-core/knowledge-import.mjs';

const read=async path=>readFile(new URL(`../${path}`, import.meta.url),'utf8');

test('CSV accepts BOM, escaped quotes, comma, and newline in quoted answer',()=>{
 const rows=parseKnowledgeCsv('\uFEFFquestion,answer\r\n"How, exactly?","Line 1\nLine ""two"""\r\n');
 assert.deepEqual(rows,[{question:'How, exactly?',answer:'Line 1\nLine "two"'}]);
});
test('TSV is accepted; blanks, duplicates and unclosed quotes rejected',()=>{
 assert.deepEqual(parseKnowledgeCsv('question\tanswer\nQ1\tA1'),[{question:'Q1',answer:'A1'}]);
 assert.throws(()=>parseKnowledgeCsv('question,answer\nA,B\na,C'),/trùng/);
 assert.throws(()=>parseKnowledgeCsv('question,answer\nA,'),/không được bỏ trống/);
 assert.throws(()=>parseKnowledgeCsv('question,answer\n"unfinished'),/chưa đóng/);
});
test('imports are chunked within the server request budget',()=>{
 const rows=Array.from({length:37},(_,i)=>({question:`Q ${i}`,answer:'test'.repeat(1300)}));
 const chunks=chunkKnowledgeDrafts(rows);
 assert.equal(chunks.flat().length,37);
 for(const chunk of chunks){assert.ok(chunk.length<=15);assert.ok(Buffer.byteLength(JSON.stringify({items:chunk,storeId:'11111111-1111-4111-8111-111111111111'}))<32000);}
});
test('bulk import is store scoped, always disabled, skips duplicates and requires access',async()=>{
 const sql=await read('web-admin/backend/modules/ai-assist/knowledge.ts');
 const route=await read('web-admin/src/app/api/ai/knowledge/route.ts');
 assert.match(sql,/store_id: actor\.storeId, question, answer, audience, enabled: false/);
 assert.match(sql,/ignoreDuplicates: true/);
 assert.match(sql,/actor\.role !== "admin" && actor\.role !== "manager"/);
 assert.match(sql,/if \(actor\.role === "admin" && value\.enabled === true\)/);
 assert.match(sql,/query = query\.eq\("enabled", false\)/);
 assert.match(sql,/CHƯA DUYỆT/);
 assert.match(route,/requireAiActor\(request,"knowledge\.read",value\.storeId\)/);
 assert.match(route,/Buffer\.byteLength\(raw,"utf8"\) > 32000/);
});
test('only manager can publish drafts from the knowledge UI', async()=>{
 const ui=await read('web-admin/frontend/ai/AiKnowledge.tsx');
 assert.match(ui,/isManager/);
 assert.match(ui,/Duyệt chọn/);
 assert.match(ui,/Tất cả|bản nháp chờ duyệt/);
 assert.match(ui,/"PUT"/);
 assert.doesNotMatch(ui,/href="\/ai-knowledge-template\.csv"/);
 assert.doesNotMatch(ui,/href="\/ai-knowledge-drafts-37\.csv"/);
 assert.match(ui,/Câu hỏi trùng khi nhập/);
 assert.match(ui,/Đã lưu trữ/);
 assert.match(ui,/Khôi phục chọn/);
});
test('37 topic CSV has substantial sourced answers grouped by audience, imported only as drafts',async()=>{
 const csv=await read('web-admin/public/ai-knowledge-drafts-37.csv');
 const rows=parseKnowledgeCsv(csv);
 assert.equal(rows.length,37);
 for (const row of rows) {
   assert.ok(row.answer.length > 70);
   assert.doesNotMatch(row.answer,/^CHƯA DUYỆT/);
   assert.ok(['customer','shipper','manager','admin'].includes(row.audience));
 }
});


test('CSV parses audience safely, rejects unknown audience',()=>{
 const rows=parseKnowledgeCsv('question,answer,audience\nHelp,Use order page,customer\nOps,For assigned only,shipper');
 assert.deepEqual(rows.map(x=>x.audience),['customer','shipper']);
 assert.throws(()=>parseKnowledgeCsv('question,answer,audience\nQ,A,superadmin'),/audience/);
});

test('review actions require server role, tenant and SQL atomicity; chat is audience scoped',async()=>{
 const service=await read('web-admin/backend/modules/ai-assist/knowledge.ts');
 const handler=await read('web-admin/src/app/api/ai/knowledge/bulk/route.ts');
 const sql=await read('supabase/migrations/0020_ai_knowledge_review_workflow.sql');
 const shared=await read('packages/ai-core/chat-server.mjs');
 const admin=await read('web-admin/backend/modules/ai-assist/chat.ts');
 for(const token of ['p_store_id: actor.storeId','p_actor_role: actor.role','ids.length > 75','new Set(ids).size']) assert.ok(service.includes(token),token);
 assert.match(handler,/requireAiActor\(request, "knowledge.read", input.storeId\)/);
 assert.match(sql,/v_changed <> cardinality\(p_ids\)/);
 assert.match(sql,/INSERT INTO public.audit_logs/);
 assert.match(sql,/REVOKE ALL ON FUNCTION.*FROM PUBLIC,anon,authenticated/);
 assert.match(shared,/\.in\("audience",audiencesForRole\(actor.role\)\)/);
 assert.match(admin,/knowledgeAudiencesForRole\(actor.role\)/);
 assert.match(admin,/\.eq\("review_status","approved"\)/);
});
