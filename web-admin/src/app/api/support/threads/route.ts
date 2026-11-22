import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiDb } from "../../../../../backend/modules/ai-assist/db";
import { apiFailure, requireJsonOrigin, readBoundedJson } from "../../../../../../packages/ai-core/response.mjs";
import { listThreads, startThread } from "../../../../../../packages/ai-core/support-server.mjs";
export const runtime="nodejs";
async function actorFor(request:Request,storeId?:string|null) {
  const scoped=await requireAiActor(request,"support.read",storeId);
    const actor={userId:scoped.id,role:scoped.role,storeIds:[scoped.storeId]};
  return actor;
}

export async function GET(request:Request) {
  try { const actor=await actorFor(request,new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listThreads(aiDb(),actor)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
export async function POST(request:Request) {
  try { requireJsonOrigin(request); const body=await readBoundedJson(request) as {storeId?:string;orderId:string};
    const actor=await actorFor(request,body.storeId);
    return Response.json(await startThread(aiDb(),actor,body.orderId));
  } catch(error) { return apiFailure(error); }
}
