import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin } from "../../../../../backend/modules/ai-assist/errors";
import { askAi, listConversations } from "../../../../../backend/modules/ai-assist/chat";
export const runtime="nodejs";
export async function GET(request:Request) {
  try { const actor=await requireAiActor(request,"chat",new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listConversations(actor)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
export async function POST(request:Request) {
  try { checkOrigin(request); const value=await readBoundedJson(request) as {storeId?:string;question?:string;conversationId?:string;level?:string;locale?:string};
    const actor=await requireAiActor(request,"chat",value.storeId);
    return Response.json(await askAi(actor,value.question,value.conversationId,value.level,value.locale),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
