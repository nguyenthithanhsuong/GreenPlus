import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin, AiError } from "../../../../../backend/modules/ai-assist/errors";
import { aiDb, resultOrFail } from "../../../../../backend/modules/ai-assist/db";
import { validUuid } from "../../../../../../packages/ai-core/policy.mjs";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await requireAiActor(request, "promotion.read", new URL(request.url).searchParams.get("storeId"));
    const { data, error } = await aiDb().from("promotions")
      .select("id,product_id,scope,discount_value,start_at,end_at,status,source,image_url")
      .eq("store_id", actor.storeId).order("created_at", { ascending: false }).limit(100);
    return Response.json({ items: resultOrFail(data, error) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return aiErrorResponse(error);
  }
}

export async function POST(request:Request){
 try{
  checkOrigin(request);
  const body=await request.json() as {storeId?:string;productId?:string;batchId?:string;discount?:number;startAt?:string;endAt?:string;imageUrl?:string};
  const actor=await requireAiActor(request,"promotion.decide",body.storeId);
  if(!validUuid(body.productId)||(body.batchId&&!validUuid(body.batchId))||!Number.isFinite(body.discount)||
   Number(body.discount)<1||Number(body.discount)>50||!body.startAt||!body.endAt)
   throw new AiError("Sản phẩm, lô, mức giảm hoặc thời gian không hợp lệ",400);
  const start=new Date(body.startAt),end=new Date(body.endAt);
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start)throw new AiError("Khoảng thời gian không hợp lệ",400);
  if (body.imageUrl) {
    const expected = aiDb().storage.from("Product-Image").getPublicUrl(`promotions/${actor.storeId}/`).data.publicUrl;
    if (typeof body.imageUrl !== "string" || body.imageUrl.length > 2048 || !body.imageUrl.startsWith(expected))
      throw new AiError("Ảnh phải được tải lên từ cửa hàng hiện tại",400);
  }
  const {data,error}=await aiDb().rpc("ai_create_manual_promotion",{
   p_store:actor.storeId,p_actor:actor.id,p_product:body.productId,p_batch:body.batchId??null,
   p_discount:body.discount,p_start:start.toISOString(),p_end:end.toISOString()});
  const created = resultOrFail(data,error) as { id?: string; status?: string };
  if (body.imageUrl && created.id) {
    const expected = aiDb().storage.from("Product-Image").getPublicUrl(`promotions/${actor.storeId}/`).data.publicUrl;
    if (!body.imageUrl.startsWith(expected) || body.imageUrl.length > 2048)
      throw new AiError("Ảnh không thuộc thư mục chương trình của cửa hàng",400);
    const update = await aiDb().from("promotions").update({ image_url: body.imageUrl })
      .eq("id",created.id).eq("store_id",actor.storeId).eq("created_by",actor.id);
    if (update.error) return Response.json({ ...created, imageWarning: "Tạo khuyến mãi thành công nhưng không lưu được ảnh" }, { status: 201 });
  }
  return Response.json(created,{status:201});
 }catch(error){return aiErrorResponse(error);}
}
