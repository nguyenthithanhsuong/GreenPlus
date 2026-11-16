import { requireCustomerAi } from "../../../../../backend/modules/ai-assist/actor";
import { getSupabaseServer } from "../../../../../backend/core/supabase";
import { askStoreChat } from "../../../../../../packages/ai-core/chat-server.mjs";
import { apiFailure, requireJsonOrigin } from "../../../../../../packages/ai-core/response.mjs";
export const runtime="nodejs";
export async function POST(request:Request) {
  try { requireJsonOrigin(request); const body=await request.json() as {storeId?:string;question?:string;conversationId?:string};
    const actor=await requireCustomerAi(request,"chat",body.storeId);
    return Response.json(await askStoreChat(getSupabaseServer(),actor,body.question,body.conversationId),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
