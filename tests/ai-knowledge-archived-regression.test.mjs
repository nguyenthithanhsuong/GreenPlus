import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('Manager/Admin listing includes soft-deleted records; chatbot listing continues excluding them', () => {
  const api=source('web-admin/src/app/api/ai/knowledge/route.ts');
  const service=source('web-admin/backend/modules/ai-assist/knowledge.ts');
  assert.match(api,/listKnowledge\(actor\.storeId,!reviewer,reviewer \? undefined : actor\.role,reviewer\)/);
  assert.match(service,/if \(!includeArchived\) query = query\.is\("deleted_at", null\)/);
  assert.match(service,/if \(onlyEnabled\) query = query\.eq\("enabled", true\)/);
  assert.match(service,/\.eq\("store_id", storeId\)/);
  assert.match(service,/\.select\("id,store_id,question,answer,audience,enabled,review_status,reviewed_at,updated_at,deleted_at"\)/);
});

test('Import identifies store-scoped duplicate location including archived unique keys',()=>{
  const code=source('web-admin/backend/modules/ai-assist/knowledge.ts');
  assert.match(code,/onConflict: "store_id,question", ignoreDuplicates: true/);
  assert.match(code,/\.eq\("store_id", actor\.storeId\)\.in\("question", skippedQuestions\)/);
  assert.match(code,/location: row\?\.deleted_at \? "archived" : row \? "active" : "unknown"/);
  assert.match(code,/return \{ added: data\?\.length \?\? 0, skipped: skippedQuestions\.length, duplicates \}/);
});

test('Reviewers can locate duplicates and archives without either CSV download button',()=>{
  const code=source('web-admin/frontend/ai/AiKnowledge.tsx');
  assert.match(code,/Câu hỏi trùng khi nhập/);
  assert.match(code,/Xem trong danh sách/);
  assert.match(code,/Kho lưu trữ/);
  assert.match(code,/Xem \{counts\.archived\} tài liệu đã lưu trữ/);
  assert.match(code,/Khôi phục bản nháp/);
  assert.match(code,/eligibleRestore/);
  assert.doesNotMatch(code,/href="\/ai-knowledge-template\.csv"/);
  assert.doesNotMatch(code,/href="\/ai-knowledge-drafts-37\.csv"/);
});

test('Restore RPC is manager-authorized, tenant-limited, disabled draft only, and audited atomically',()=>{
  const code=source('supabase/migrations/0021_ai_knowledge_restore_archived.sql');
  const backend=source('web-admin/backend/modules/ai-assist/knowledge.ts');
  assert.match(code,/p_actor_role <> 'manager'/);
  assert.match(code,/lower\(r\.role_name\) = 'manager'/);
  assert.match(code,/m\.store_id = p_store_id AND m\.status = 'active'/);
  assert.match(code,/k\.store_id = p_store_id AND k\.id = ANY\(p_ids\) AND k\.deleted_at IS NOT NULL/);
  assert.match(code,/SET deleted_at=NULL, enabled=false,\s+review_status='draft'/);
  assert.match(code,/INSERT INTO public\.audit_logs/);
  assert.match(code,/GRANT EXECUTE ON FUNCTION public\.ai_knowledge_restore_drafts\(uuid,uuid,text,uuid\[\]\) TO service_role/);
  assert.doesNotMatch(code,/GRANT EXECUTE ON FUNCTION.*TO authenticated/);
  assert.match(backend,/actor\.role !== "manager" && action !== "delete"/);
});
