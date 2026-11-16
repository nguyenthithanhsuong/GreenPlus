import { callAiService } from "../../../../packages/ai-core/ai-client.mjs";
import { safeText, validUuid } from "../../../../packages/ai-core/policy.mjs";
import { aiDb, resultOrFail } from "./db";
import { AiError } from "./errors";
import { listKnowledge } from "./knowledge";
import { consumeAiQuota } from "./quota";
import type { AiActor } from "./types";

export async function listConversations(actor:AiActor) {
  const {data,error}=await aiDb().from("ai_conversations").select("id,role,created_at")
    .eq("store_id",actor.storeId).eq("actor_id",actor.id).order("created_at",{ascending:false}).limit(30);
  return resultOrFail(data,error);
}
export async function readConversation(actor:AiActor,id:string) {
  if (!validUuid(id)) throw new AiError("Hội thoại không hợp lệ",400);
  const {data:owner,error:ownerError}=await aiDb().from("ai_conversations").select("id")
    .eq("id",id).eq("store_id",actor.storeId).eq("actor_id",actor.id).maybeSingle();
  resultOrFail(owner,ownerError);
  const {data,error}=await aiDb().from("ai_messages").select("id,question,answer,answer_mode,confidence,source_ids,handoff,created_at")
    .eq("conversation_id",id).eq("store_id",actor.storeId).order("created_at",{ascending:true}).limit(100);
  return resultOrFail(data,error);
}
export async function askAi(actor:AiActor,question:unknown,conversationId?:unknown) {
  const query=safeText(question,1500,2);
  if (!query) throw new AiError("Câu hỏi cần từ 2 đến 1500 ký tự",400);
  if (conversationId!=null && !validUuid(conversationId)) throw new AiError("Hội thoại không hợp lệ",400);
  await consumeAiQuota(actor,"chat");
  let id=conversationId as string | undefined;
  if (id) {
    const {data,error}=await aiDb().from("ai_conversations").select("id")
      .eq("id",id).eq("store_id",actor.storeId).eq("actor_id",actor.id).maybeSingle();
    resultOrFail(data,error);
  } else {
    const {data,error}=await aiDb().from("ai_conversations")
      .insert({store_id:actor.storeId,actor_id:actor.id,role:actor.role}).select("id").single();
    id=resultOrFail(data,error).id;
  }
  const knowledge=await listKnowledge(actor.storeId);
  const response=await callAiService("chat",{store_id:actor.storeId,role:actor.role,question:query,
    knowledge:knowledge.map((row)=>({id:row.id,question:row.question,answer:row.answer}))});
  const answer=safeText(response.answer,6000);
  if (!answer || !Array.isArray(response.sources)) throw new AiError("Phản hồi AI không hợp lệ",503);
  const sources=response.sources.filter((id):id is string=>typeof id==="string" && knowledge.some((row)=>row.id===id));
  const {data,error}=await aiDb().from("ai_messages").insert({store_id:actor.storeId,conversation_id:id,
    actor_id:actor.id,question:query,answer,answer_mode:String(response.mode??"unknown").slice(0,50),
    confidence:Math.max(0,Math.min(1,Number(response.confidence??0))),source_ids:sources,
    handoff:response.handoff===true}).select("id").single();
  resultOrFail(data,error);
  return {conversationId:id,answer,mode:response.mode,confidence:response.confidence,sources,handoff:response.handoff};
}
