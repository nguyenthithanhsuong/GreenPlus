import { callAiService } from "../../../../packages/ai-core/ai-client.mjs";
import { assertSameStore, validUuid } from "../../../../packages/ai-core/policy.mjs";
import { aiDb, resultOrFail } from "./db";
import { AiError } from "./errors";
import { consumeAiQuota } from "./quota";
import { latestForecasts } from "./forecasts";
import type { AiActor } from "./types";

export async function listSuggestions(storeId:string) {
  const {data,error} = await aiDb().from("promotion_suggestions")
    .select("id,product_id,batch_id,status,reason,suggested_discount_pct,suggested_start_at,suggested_end_at,expected_sell_through,model_version,created_at")
    .eq("store_id",storeId).order("created_at",{ascending:false}).limit(100);
  return resultOrFail(data,error);
}
export async function generateSuggestions(actor:AiActor) {
  await consumeAiQuota(actor,"promotions");
  const recent=await latestForecasts(actor.storeId);
  const best = new Map<string,typeof recent[number]>();
  for (const row of recent) { const key=`${row.product_id}:${row.batch_id}`; if (!best.has(key)) best.set(key,row); }
  const known=await listSuggestions(actor.storeId);
  const pending=new Set(known.filter((row)=>row.status==="pending").map((row)=>`${row.product_id}:${row.batch_id}`));
  const generated=[];
  for (const row of [...best.values()].slice(0,50)) {
    const key=`${row.product_id}:${row.batch_id}`;
    if (pending.has(key) || row.available<=0 || (row.days_to_expiry!==null && row.days_to_expiry<=0)) continue;
    const result=await callAiService("promotion", {store_id:actor.storeId,product_id:row.product_id,batch_id:row.batch_id,
      available:row.available,expiry_days:row.days_to_expiry,daily_demand:row.predicted_daily_units,confidence:row.confidence});
    if (!result.eligible) continue;
    assertSameStore(actor.storeId,String(result.store_id));
    if (result.product_id!==row.product_id || result.batch_id!==row.batch_id || result.approval_required!==true)
      throw new AiError("Đề xuất AI không hợp lệ",503);
    const discount=Number(result.suggested_discount_pct);
    if (!Number.isFinite(discount) || discount<=0 || discount>50) throw new AiError("Mức giảm AI không an toàn",503);
    const suggestion={store_id:actor.storeId,product_id:row.product_id,batch_id:row.batch_id,
      suggested_discount_pct:discount,suggested_start_at:result.suggested_start_at,
      suggested_end_at:result.suggested_end_at,reason:result.reason,
      expected_sell_through:result.expected_sell_through,model_version:result.model_version,status:"pending"};
    const inserted=await aiDb().from("promotion_suggestions").insert(suggestion).select("id").single();
    if (inserted.error) throw new AiError("Không lưu được đề xuất",503);
    generated.push(inserted.data);
  }
  return { created:generated.length, suggestions:await listSuggestions(actor.storeId) };
}
export async function decideSuggestion(actor:AiActor,id:string,choice:string,discount?:number) {
  if (!validUuid(id) || !["accepted","rejected"].includes(choice)) throw new AiError("Quyết định không hợp lệ",400);
  if (discount!=null && (!Number.isFinite(discount) || discount<=0 || discount>50)) throw new AiError("Mức giảm phải từ 0 đến 50%",400);
  const {data,error}=await aiDb().rpc("ai_decide_promotion",{p_store:actor.storeId,p_suggestion:id,
    p_actor:actor.id,p_decision:choice,p_discount:discount??null});
  return resultOrFail(data,error);
}
