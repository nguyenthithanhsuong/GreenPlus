import { requireAiActor } from "../../../../../../../backend/modules/ai-assist/actor";
import { aiDb } from "../../../../../../../backend/modules/ai-assist/db";
import { apiFailure, requireJsonOrigin, readBoundedJson } from "../../../../../../../../packages/ai-core/response.mjs";
import { escalateThread } from "../../../../../../../../packages/ai-core/support-server.mjs";
export const runtime="nodejs";
async function actorFor(request:Request,storeId?:string|null) {
  const scoped=await requireAiActor(request,"support.read",storeId);
    const actor={userId:scoped.id,role:scoped.role,storeIds:[scoped.storeId]};
  return actor;
}

export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}) {
  try { requireJsonOrigin(request);const body=await readBoundedJson(request) as {storeId?:string};
    const actor=await actorFor(request,body.storeId);
    return Response.json(await escalateThread(aiDb(),actor,(await params).threadId));
  } catch(error) { return apiFailure(error); }
}
