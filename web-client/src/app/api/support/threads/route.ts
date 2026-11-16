import { requireCustomerAi } from "../../../../../backend/modules/ai-assist/actor";
import { getSupabaseServer } from "../../../../../backend/core/supabase";
import { apiFailure, requireJsonOrigin } from "../../../../../../packages/ai-core/response.mjs";
import { listThreads, startThread } from "../../../../../../packages/ai-core/support-server.mjs";
export const runtime="nodejs";
async function actorFor(request:Request,storeId?:string|null) {
  const actor=await requireCustomerAi(request,"support.read",storeId);
  return actor;
}

export async function GET(request:Request) {
  try { const actor=await actorFor(request,new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listThreads(getSupabaseServer(),actor)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
export async function POST(request:Request) {
  try { requireJsonOrigin(request); const body=await request.json() as {storeId?:string;orderId:string};
    const actor=await actorFor(request,body.storeId);
    return Response.json(await startThread(getSupabaseServer(),actor,body.orderId));
  } catch(error) { return apiFailure(error); }
}
