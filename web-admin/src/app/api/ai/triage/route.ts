import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin, AiError } from "../../../../../backend/modules/ai-assist/errors";
import { callAiService } from "../../../../../../packages/ai-core/ai-client.mjs";
import { validUuid } from "../../../../../../packages/ai-core/policy.mjs";
import { aiDb, resultOrFail } from "../../../../../backend/modules/ai-assist/db";
import { consumeAiQuota } from "../../../../../backend/modules/ai-assist/quota";
export const runtime="nodejs";
export async function GET(request:Request) {
  try { const actor=await requireAiActor(request,"complaint.read",new URL(request.url).searchParams.get("storeId"));
    const {data,error}=await aiDb().from("ai_complaint_triage").select("*").eq("store_id",actor.storeId).order("created_at",{ascending:false}).limit(100);
    return Response.json({items:resultOrFail(data,error)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
export async function POST(request:Request) {
  try { checkOrigin(request); const value=await request.json() as {storeId?:string;complaintId?:string};
    const actor=await requireAiActor(request,"complaint.triage",value.storeId);
    if (!validUuid(value.complaintId)) throw new AiError("Mã khiếu nại không hợp lệ");
    await consumeAiQuota(actor,"triage");
    const {data,error}=await aiDb().from("complaints").select("complaint_id,description")
      .eq("store_id",actor.storeId).eq("complaint_id",value.complaintId).maybeSingle();
    const complaint=resultOrFail(data,error);
    const response=await callAiService("complaints",{store_id:actor.storeId,text:complaint.description});
    const {data:tagged,error:tagError}=await aiDb().from("ai_complaint_triage")
      .upsert({store_id:actor.storeId,complaint_id:complaint.complaint_id,category:response.category,
        priority:response.priority,confidence:response.confidence,model_version:response.mode},
        {onConflict:"complaint_id"}).select().single();
    return Response.json(resultOrFail(tagged,tagError));
  } catch(error) { return aiErrorResponse(error); }
}
