import { aiDb, resultOrFail } from "./db";
import { AiError } from "./errors";
import { safeText, validUuid } from "../../../../packages/ai-core/policy.mjs";
import type { AiActor } from "./types";

export async function listKnowledge(storeId: string, onlyEnabled = true) {
  let query = aiDb().from("ai_knowledge").select("id,store_id,question,answer,enabled,updated_at")
    .eq("store_id", storeId).order("updated_at", { ascending: false }).limit(75);
  if (onlyEnabled) query = query.eq("enabled", true);
  const { data, error } = await query;
  return resultOrFail(data, error);
}
export async function updateKnowledge(actor: AiActor, body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new AiError("Dữ liệu không hợp lệ");
  const value = body as Record<string, unknown>;
  const question = safeText(value.question, 300);
  const answer = safeText(value.answer, 6000);
  if (!question || !answer) throw new AiError("Câu hỏi hoặc câu trả lời không hợp lệ");
  if (value.id != null && !validUuid(value.id)) throw new AiError("Mã tài liệu không hợp lệ");
  if (value.enabled != null && typeof value.enabled !== "boolean") throw new AiError("Trạng thái không hợp lệ");
  const fields = { question, answer, enabled: value.enabled ?? true, updated_at: new Date().toISOString() };
  if (value.id) {
    const { data, error } = await aiDb().from("ai_knowledge").update(fields)
      .eq("store_id", actor.storeId).eq("id", value.id).select().maybeSingle();
    return resultOrFail(data, error);
  }
  const { data, error } = await aiDb().from("ai_knowledge")
    .insert({ ...fields, store_id: actor.storeId, created_by: actor.id }).select().single();
  return resultOrFail(data, error);
}
export async function removeKnowledge(actor: AiActor, id: string) {
  if (!validUuid(id)) throw new AiError("Mã tài liệu không hợp lệ");
  const { data, error } = await aiDb().from("ai_knowledge")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("store_id", actor.storeId).eq("id", id).select("id").maybeSingle();
  return resultOrFail(data, error);
}
