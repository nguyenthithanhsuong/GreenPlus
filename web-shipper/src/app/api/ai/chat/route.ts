import { requireShipperAi } from "../../../../server/ai-actor";
import { shipperDb } from "../../../../server/shipper-db";
import { askStoreChat } from "../../../../../../packages/ai-core/chat-server.mjs";
import { chatPreferences } from "../../../../../../packages/ai-core/chat-levels.mjs";
import { apiFailure, requireJsonOrigin, readBoundedJson } from "../../../../../../packages/ai-core/response.mjs";
export const runtime="nodejs";
export async function POST(request:Request) {
  try { requireJsonOrigin(request); const body=await readBoundedJson(request) as {storeId?:string;question?:string;conversationId?:string;level?:string;locale?:string};
    const actor=await requireShipperAi(request,"chat",body.storeId);
    const {level,locale}=chatPreferences(body.level,body.locale);
    return Response.json(await askStoreChat(shipperDb(),actor,body.question,body.conversationId,level,locale),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
