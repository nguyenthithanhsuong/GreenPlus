import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin, AiError } from "../../../../../backend/modules/ai-assist/errors";
import { aiDb, resultOrFail } from "../../../../../backend/modules/ai-assist/db";
import { validUuid } from "../../../../../../packages/ai-core/policy.mjs";
export const runtime="nodejs";
export async function GET(request:Request) {
  try { const actor=await requireAiActor(request,"forecast.read",new URL(request.url).searchParams.get("storeId"));
    const {data,error}=await aiDb().from("inventory_alerts").select("*")
      .eq("store_id",actor.storeId).order("created_at",{ascending:false}).limit(100);
    return Response.json({items:resultOrFail(data,error)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
export async function PATCH(request:Request) {
  try { checkOrigin(request); const value=await request.json() as {storeId?:string;alertId?:string};
    const actor=await requireAiActor(request,"forecast.run",value.storeId);
    if (!validUuid(value.alertId)) throw new AiError("Mã cảnh báo không hợp lệ");
    const {data,error}=await aiDb().from("inventory_alerts").update({status:"acknowledged"})
      .eq("store_id",actor.storeId).eq("id",value.alertId).eq("status","open").select("id,status").maybeSingle();
    return Response.json(resultOrFail(data,error));
  } catch(error) { return aiErrorResponse(error); }
}
