import { requireShipperAi } from "../../../../../server/ai-actor";
import { shipperDb } from "../../../../../server/shipper-db";
import { readStoreChat } from "../../../../../../../packages/ai-core/chat-server.mjs";
import { apiFailure } from "../../../../../../../packages/ai-core/response.mjs";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try { const actor=await requireShipperAi(request,"chat",new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await readStoreChat(shipperDb(),actor,(await params).id)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
