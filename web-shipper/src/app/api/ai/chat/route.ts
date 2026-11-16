import { requireShipperAi } from "../../../../server/ai-actor";
import { shipperDb } from "../../../../server/shipper-db";
import { askStoreChat } from "../../../../../../packages/ai-core/chat-server.mjs";
import { apiFailure, requireJsonOrigin } from "../../../../../../packages/ai-core/response.mjs";
export const runtime="nodejs";
export async function POST(request:Request) {
  try { requireJsonOrigin(request); const body=await request.json() as {storeId?:string;question?:string;conversationId?:string};
    const actor=await requireShipperAi(request,"chat",body.storeId);
    return Response.json(await askStoreChat(shipperDb(),actor,body.question,body.conversationId),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
