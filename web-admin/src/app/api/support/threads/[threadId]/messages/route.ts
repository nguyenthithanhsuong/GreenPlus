import { requireAiActor } from "../../../../../../../backend/modules/ai-assist/actor";
import { aiDb } from "../../../../../../../backend/modules/ai-assist/db";
import { apiFailure, requireJsonOrigin } from "../../../../../../../../packages/ai-core/response.mjs";
import { listMessages, sendMessage } from "../../../../../../../../packages/ai-core/support-server.mjs";
export const runtime="nodejs";
async function actorFor(request:Request,storeId?:string|null) {
  const scoped=await requireAiActor(request,"support.read",storeId);
    const actor={userId:scoped.id,role:scoped.role,storeIds:[scoped.storeId]};
  return actor;
}

export async function GET(request:Request,{params}:{params:Promise<{threadId:string}>}) {
  try { const actor=await actorFor(request,new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listMessages(aiDb(),actor,(await params).threadId)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}) {
  try { requireJsonOrigin(request);const body=await request.json() as {storeId?:string;body?:string};
    const actor=await actorFor(request,body.storeId);
    return Response.json(await sendMessage(aiDb(),actor,(await params).threadId,body.body));
  } catch(error) { return apiFailure(error); }
}
