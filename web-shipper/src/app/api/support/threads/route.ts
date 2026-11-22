import { requireShipperAi } from "../../../../server/ai-actor";
import { shipperDb } from "../../../../server/shipper-db";
import { apiFailure, requireJsonOrigin, readBoundedJson } from "../../../../../../packages/ai-core/response.mjs";
import { listThreads, startThread } from "../../../../../../packages/ai-core/support-server.mjs";
export const runtime="nodejs";
async function actorFor(request:Request,storeId?:string|null) {
  const actor=await requireShipperAi(request,"support.read",storeId);
  return actor;
}

export async function GET(request:Request) {
  try { const actor=await actorFor(request,new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listThreads(shipperDb(),actor)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
export async function POST(request:Request) {
  try { requireJsonOrigin(request); const body=await readBoundedJson(request) as {storeId?:string;orderId:string};
    const actor=await actorFor(request,body.storeId);
    return Response.json(await startThread(shipperDb(),actor,body.orderId));
  } catch(error) { return apiFailure(error); }
}
