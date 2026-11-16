import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin } from "../../../../../backend/modules/ai-assist/errors";
import { listKnowledge, updateKnowledge } from "../../../../../backend/modules/ai-assist/knowledge";
export const runtime="nodejs";
export async function GET(request:Request) {
  try { const actor=await requireAiActor(request,"knowledge.read",new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listKnowledge(actor.storeId,actor.role!=="manager")},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
export async function POST(request:Request) {
  try { checkOrigin(request); const value=await request.json() as {storeId?:string};
    const actor=await requireAiActor(request,"knowledge.write",value.storeId);
    return Response.json(await updateKnowledge(actor,value));
  } catch(error) { return aiErrorResponse(error); }
}
