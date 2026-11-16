import { requireAiActor } from "../../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse } from "../../../../../../backend/modules/ai-assist/errors";
import { readConversation } from "../../../../../../backend/modules/ai-assist/chat";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{conversationId:string}>}) {
  try { const actor=await requireAiActor(request,"chat",new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await readConversation(actor,(await params).conversationId)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
