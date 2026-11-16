import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse } from "../../../../../backend/modules/ai-assist/errors";
import { aiInsights } from "../../../../../backend/modules/ai-assist/insights";
export const runtime = "nodejs";
export async function GET(request:Request) {
  try { const url=new URL(request.url); const actor=await requireAiActor(request,"forecast.read",url.searchParams.get("storeId"));
    return Response.json(await aiInsights(actor.storeId),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
