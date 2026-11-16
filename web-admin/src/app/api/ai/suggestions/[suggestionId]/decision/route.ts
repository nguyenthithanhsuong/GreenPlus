import { requireAiActor } from "../../../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin } from "../../../../../../../backend/modules/ai-assist/errors";
import { decideSuggestion } from "../../../../../../../backend/modules/ai-assist/promotions";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{suggestionId:string}>}) {
  try { checkOrigin(request); const value=await request.json() as {storeId?:string;decision:string;discount?:number};
    const actor=await requireAiActor(request,"promotion.decide",value.storeId);
    const {suggestionId}=await params;
    return Response.json(await decideSuggestion(actor,suggestionId,value.decision,value.discount));
  } catch(error) { return aiErrorResponse(error); }
}
