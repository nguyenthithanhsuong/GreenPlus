import { requireCustomerAi } from "../../../../../../../backend/modules/ai-assist/actor";
import { getSupabaseServer } from "../../../../../../../backend/core/supabase";
import { apiFailure, requireJsonOrigin, readBoundedJson } from "../../../../../../../../packages/ai-core/response.mjs";
import { listMessages, sendMessage } from "../../../../../../../../packages/ai-core/support-server.mjs";
export const runtime="nodejs";
async function actorFor(request:Request,storeId?:string|null) {
  const actor=await requireCustomerAi(request,"support.read",storeId);
  return actor;
}

export async function GET(request:Request,{params}:{params:Promise<{threadId:string}>}) {
  try { const actor=await actorFor(request,new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listMessages(getSupabaseServer(),actor,(await params).threadId)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}) {
  try { requireJsonOrigin(request);const body=await readBoundedJson(request) as {storeId?:string;body?:string};
    const actor=await actorFor(request,body.storeId);
    return Response.json(await sendMessage(getSupabaseServer(),actor,(await params).threadId,body.body));
  } catch(error) { return apiFailure(error); }
}
