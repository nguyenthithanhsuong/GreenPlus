import { aiDb, resultOrFail } from "./db";
import { AiError } from "./errors";
import { safeText, validUuid } from "../../../../packages/ai-core/policy.mjs";
import type { AiActor } from "./types";

export type KnowledgeAction = "approve" | "reject" | "delete" | "restore" | "purge";
export type KnowledgeAudience = "customer" | "shipper" | "manager" | "admin";
const audiences = ["customer", "shipper", "manager", "admin"] as const;

function isUnreviewedAnswer(value: string): boolean {
  return /^(?:CHƯA DUYỆT|MẪU\s*-|CHƯA XÁC NHẬN)/iu.test(value.trim()) || value.trim().length < 25;
}

export async function listKnowledge(storeId: string, onlyEnabled = true, role?: string, includeArchived = false) {
  let query = aiDb().from("ai_knowledge")
    .select("id,store_id,question,answer,audience,enabled,review_status,reviewed_at,updated_at,deleted_at")
    .eq("store_id", storeId)
    .order("updated_at", { ascending: false }).limit(1000);
  // Reviewers must also see archived rows: the unique (store_id,question) constraint
  // still reserves their questions, so hiding them makes imports appear mysteriously duplicated.
  if (!includeArchived) query = query.is("deleted_at", null);
  if (onlyEnabled) query = query.eq("enabled", true).eq("review_status", "approved");
  if (role) query = query.in("audience", knowledgeAudiencesForRole(role));
  const { data, error } = await query;
  return resultOrFail(data, error);
}

export function knowledgeAudiencesForRole(role: string): KnowledgeAudience[] {
  if (role === "admin") return ["customer","shipper","manager","admin"];
  if (role === "manager") return ["customer","shipper","manager"];
  if (role === "shipper") return ["customer","shipper"];
  return ["customer"];
}

/** Admin prepares unpublished drafts. Manager owns publish/rejection decisions. */
export async function updateKnowledge(actor: AiActor, body: unknown) {
  if (actor.role !== "admin" && actor.role !== "manager") throw new AiError("Không có quyền quản lý kho tri thức", 403);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new AiError("Dữ liệu không hợp lệ");
  const value = body as Record<string, unknown>;
  const question = safeText(value.question, 300);
  const answer = safeText(value.answer, 6000);
  const audience = value.audience ?? "customer";
  if (!audiences.includes(audience as KnowledgeAudience)) throw new AiError("Đối tượng tài liệu không hợp lệ");
  if (!question || !answer) throw new AiError("Câu hỏi hoặc câu trả lời không hợp lệ");
  if (value.id != null && !validUuid(value.id)) throw new AiError("Mã tài liệu không hợp lệ");
  if (value.enabled != null && typeof value.enabled !== "boolean") throw new AiError("Trạng thái không hợp lệ");
  if (actor.role === "admin" && value.enabled === true) throw new AiError("Chỉ Manager có thể duyệt tài liệu", 403);
  if (value.enabled === true && isUnreviewedAnswer(answer))
    throw new AiError("Câu trả lời quá ngắn hoặc chưa được kiểm chứng; cần cập nhật trước khi duyệt", 400);

  const publish = actor.role === "manager" && value.enabled === true;
  const fields = {
    question, answer, audience, enabled: publish, review_status: publish ? "approved" : "draft",
    reviewed_by: publish ? actor.id : null,
    reviewed_at: publish ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (value.id) {
    let query = aiDb().from("ai_knowledge").update(fields)
      .eq("store_id", actor.storeId).eq("id", value.id).is("deleted_at", null);
    // Atomic guard: Admin cannot change Manager-approved or rejected rows.
    if (actor.role === "admin") query = query.eq("enabled", false).eq("review_status", "draft");
    const { data, error } = await query.select().maybeSingle();
    if (!error && !data) throw new AiError("Không tìm thấy tài liệu có thể chỉnh sửa trong cửa hàng này", 403);
    return resultOrFail(data, error);
  }
  const { data, error } = await aiDb().from("ai_knowledge")
    .insert({ ...fields, store_id: actor.storeId, created_by: actor.id }).select().single();
  return resultOrFail(data, error);
}

/** Import only drafts, without overwriting any existing question in this store. */
export async function importKnowledgeDrafts(actor: AiActor, input: unknown) {
  if (actor.role !== "admin" && actor.role !== "manager") throw new AiError("Không có quyền nhập kho tri thức", 403);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AiError("Dữ liệu nhập không hợp lệ");
  const items = (input as {items?:unknown}).items;
  if (!Array.isArray(items) || !items.length || items.length > 15) throw new AiError("Mỗi lượt nhập cần 1–15 tài liệu", 400);
  const seen = new Set<string>();
  const records = items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new AiError("Tài liệu không hợp lệ");
    const value = item as Record<string,unknown>;
    const question = safeText(value.question,300);
    const answer = safeText(value.answer,6000);
    const audience = value.audience ?? "customer";
    if (!audiences.includes(audience as KnowledgeAudience)) throw new AiError("Đối tượng tài liệu không hợp lệ");
    if (!question || !answer) throw new AiError("Câu hỏi hoặc câu trả lời không hợp lệ");
    const key = question.toLocaleLowerCase("vi");
    if (seen.has(key)) throw new AiError("Có câu hỏi trùng trong lượt nhập");
    seen.add(key);
    return { store_id: actor.storeId, question, answer, audience, enabled: false,
      review_status: "draft", created_by: actor.id, updated_at: new Date().toISOString() };
  });
  const { data, error } = await aiDb().from("ai_knowledge")
    .upsert(records, {onConflict: "store_id,question", ignoreDuplicates: true})
    .select("id,question");
  if (error) throw new AiError("Nhập kho tri thức thất bại. Kiểm tra quyền và migration 0020",503);
  const addedQuestions = new Set((data ?? []).map(row => row.question));
  const skippedQuestions = records.filter(row => !addedQuestions.has(row.question)).map(row => row.question);
  if (!skippedQuestions.length) return { added: records.length, skipped: 0, duplicates: [] };
  // Query after the write so duplicate reasons match the actual store and database state.
  // Include soft-deleted rows; UNIQUE(store_id,question) reserves those questions too.
  const { data: matches, error: lookupError } = await aiDb().from("ai_knowledge")
    .select("id,question,review_status,deleted_at")
    .eq("store_id", actor.storeId).in("question", skippedQuestions).limit(15);
  if (lookupError) throw new AiError("Đã nhập một phần nhưng không tra cứu được tài liệu trùng. Hãy tải lại và kiểm tra kho lưu trữ.", 503);
  const duplicates = skippedQuestions.map(question => {
    const row = (matches ?? []).find(item => item.question === question);
    return { question, id: row?.id ?? null,
      location: row?.deleted_at ? "archived" : row ? "active" : "unknown",
      review_status: row?.review_status ?? null };
  });
  return { added: data?.length ?? 0, skipped: skippedQuestions.length, duplicates };
}

/** All-or-nothing, with tenant and role enforcement inside a database transaction. */
export async function bulkKnowledge(actor: AiActor, input: unknown) {
  if (actor.role !== "manager" && actor.role !== "admin") throw new AiError("Không có quyền quản lý tài liệu", 403);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AiError("Thao tác không hợp lệ");
  const value = input as Record<string, unknown>;
  const action = value.action;
  const ids = value.ids;
  if (action !== "approve" && action !== "reject" && action !== "delete" && action !== "restore" && action !== "purge") throw new AiError("Thao tác không hợp lệ");
  if (actor.role !== "manager" && action !== "delete") throw new AiError("Chỉ Manager có thể duyệt, từ chối hoặc khôi phục",403);
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 75 ||
      ids.some(id => !validUuid(id)) || new Set(ids).size !== ids.length)
    throw new AiError("Chọn từ 1 đến 75 tài liệu hợp lệ, không trùng lặp");
  const { data, error } = action === "restore"
    ? await aiDb().rpc("ai_knowledge_restore_drafts", {
      p_store_id: actor.storeId, p_actor_id: actor.id, p_actor_role: actor.role, p_ids: ids as string[],
    })
    : action === "purge" ? await aiDb().rpc("ai_knowledge_purge_archived", {
      p_store_id: actor.storeId, p_actor_id: actor.id, p_actor_role: actor.role, p_ids: ids as string[],
    })
    : await aiDb().rpc("ai_knowledge_bulk_action", {
      p_store_id: actor.storeId, p_actor_id: actor.id, p_actor_role: actor.role,
      p_ids: ids as string[], p_action: action,
    });
  if (error) throw new AiError("Không thực hiện được trên toàn bộ lựa chọn. Tải lại danh sách, kiểm tra trạng thái, quyền Manager và migration 0020–0022.", 409);
  if (typeof data !== "number" || data !== ids.length) throw new AiError("Kết quả thao tác không khớp; tải lại danh sách", 503);
  return { affected: data, action };
}

/** DELETE now means an explicit, auditable soft-delete, not merely disable. */
export async function removeKnowledge(actor: AiActor, id: string) {
  if (!validUuid(id)) throw new AiError("Mã tài liệu không hợp lệ");
  return bulkKnowledge(actor, { action: "delete", ids: [id] });
}
