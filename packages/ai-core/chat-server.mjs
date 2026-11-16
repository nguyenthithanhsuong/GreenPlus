import { callAiService } from "./ai-client.mjs";
import { safeText, validUuid, hourlyLimit } from "./policy.mjs";

export class ChatError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function result(result) {
  if (result.error) throw new ChatError("Không thể truy cập dữ liệu hội thoại", 503);
  return result.data;
}
export async function askStoreChat(db, actor, message, prior) {
  const question = safeText(message, 1500, 2);
  if (!question) throw new ChatError("Câu hỏi không hợp lệ", 400);
  if (prior != null && !validUuid(prior)) throw new ChatError("Mã hội thoại không hợp lệ",400);
  const quota = result(await db.rpc("ai_consume_quota", { p_store:actor.storeId, p_actor:actor.userId,
    p_action:"chat", p_limit:hourlyLimit(actor.role) }));
  if (!quota) throw new ChatError("Đã hết lượt AI trong giờ",429);
  let conversationId = prior;
  if (conversationId) {
    const owned = result(await db.from("ai_conversations").select("id").eq("id",conversationId)
      .eq("actor_id",actor.userId).eq("store_id",actor.storeId).maybeSingle());
    if (!owned) throw new ChatError("Hội thoại không tồn tại",404);
  } else {
    const conversation = result(await db.from("ai_conversations")
      .insert({ store_id:actor.storeId,actor_id:actor.userId,role:actor.role }).select("id").single());
    conversationId=conversation.id;
  }
  const knowledge = result(await db.from("ai_knowledge").select("id,question,answer")
    .eq("store_id",actor.storeId).eq("enabled",true).limit(75));
  const response = await callAiService("chat",{store_id:actor.storeId,role:actor.role,question,
    knowledge:knowledge.map((entry)=>({id:entry.id,question:entry.question,answer:entry.answer}))});
  const answer = safeText(response.answer,6000);
  if (!answer || !Array.isArray(response.sources)) throw new ChatError("AI trả dữ liệu không hợp lệ",503);
  const sources=response.sources.filter((id)=>typeof id==="string" && knowledge.some((entry)=>entry.id===id));
  result(await db.from("ai_messages").insert({store_id:actor.storeId,conversation_id:conversationId,
    actor_id:actor.userId,question,answer,answer_mode:String(response.mode??"retrieval").slice(0,50),
    confidence:Math.min(1,Math.max(0,Number(response.confidence)||0)),source_ids:sources,
    handoff:response.handoff===true}).select("id").single());
  return {conversationId,answer,mode:response.mode,confidence:response.confidence,sources,handoff:response.handoff};
}
export async function readStoreChat(db,actor,id) {
  if (!validUuid(id)) throw new ChatError("Mã hội thoại không hợp lệ",400);
  const owned = result(await db.from("ai_conversations").select("id")
    .eq("id",id).eq("actor_id",actor.userId).eq("store_id",actor.storeId).maybeSingle());
  if (!owned) throw new ChatError("Hội thoại không tồn tại",404);
  return result(await db.from("ai_messages").select("id,question,answer,answer_mode,confidence,handoff,created_at")
    .eq("store_id",actor.storeId).eq("conversation_id",id).order("created_at",{ascending:true}).limit(100));
}
