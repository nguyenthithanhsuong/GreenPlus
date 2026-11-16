import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin } from "../../../../../backend/modules/ai-assist/errors";
import { listSuggestions, generateSuggestions } from "../../../../../backend/modules/ai-assist/promotions";
export const runtime="nodejs";
export async function GET(request:Request) {
  try { const actor=await requireAiActor(request,"promotion.read",new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listSuggestions(actor.storeId)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
export async function POST(request:Request) {
  try { checkOrigin(request); const body=await request.json() as {storeId?:string};
    const actor=await requireAiActor(request,"promotion.generate",body.storeId);
    return Response.json(await generateSuggestions(actor),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
