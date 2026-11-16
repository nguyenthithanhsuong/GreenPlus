import { requireCustomerAi } from "../../../../../../backend/modules/ai-assist/actor";
import { getSupabaseServer } from "../../../../../../backend/core/supabase";
import { readStoreChat } from "../../../../../../../packages/ai-core/chat-server.mjs";
import { apiFailure } from "../../../../../../../packages/ai-core/response.mjs";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try { const actor=await requireCustomerAi(request,"chat",new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await readStoreChat(getSupabaseServer(),actor,(await params).id)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
