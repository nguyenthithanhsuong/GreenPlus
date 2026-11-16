import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin } from "../../../../../backend/modules/ai-assist/errors";
import { forecastStore, latestForecasts } from "../../../../../backend/modules/ai-assist/forecasts";
export const runtime = "nodejs";
export async function GET(request:Request) {
  try { const actor=await requireAiActor(request,"forecast.read",new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await latestForecasts(actor.storeId)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
export async function POST(request:Request) {
  try { checkOrigin(request); const input=await request.json() as {storeId?:string};
    const actor=await requireAiActor(request,"forecast.run",input.storeId);
    return Response.json(await forecastStore(actor,true),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
