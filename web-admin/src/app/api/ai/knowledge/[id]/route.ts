import { requireAiActor } from "../../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin } from "../../../../../../backend/modules/ai-assist/errors";
import { removeKnowledge } from "../../../../../../backend/modules/ai-assist/knowledge";
export const runtime="nodejs";
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}) {
  try { const actor=await requireAiActor(request,"knowledge.write",new URL(request.url).searchParams.get("storeId"));
    checkOrigin(request); return Response.json(await removeKnowledge(actor,(await params).id));
  } catch(error) { return aiErrorResponse(error); }
}
