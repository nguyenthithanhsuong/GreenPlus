import { requireCustomerAi } from "../../../../../backend/modules/ai-assist/actor";
import { getSupabaseServer } from "../../../../../backend/core/supabase";
import { askStoreChat } from "../../../../../../packages/ai-core/chat-server.mjs";
import { chatPreferences } from "../../../../../../packages/ai-core/chat-levels.mjs";
import { apiFailure, requireJsonOrigin } from "../../../../../../packages/ai-core/response.mjs";
export const runtime="nodejs";
export async function POST(request:Request) {
  try { requireJsonOrigin(request); const body=await request.json() as {storeId?:string;question?:string;conversationId?:string;level?:string;locale?:string};
    const actor=await requireCustomerAi(request,"chat",body.storeId);
    const {level,locale}=chatPreferences(body.level,body.locale);
    return Response.json(await askStoreChat(getSupabaseServer(),actor,body.question,body.conversationId,level,locale),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
