import { requireAiActor } from "../../../../../../backend/modules/ai-assist/actor";
import { aiDb } from "../../../../../../backend/modules/ai-assist/db";
import { apiFailure, requireJsonOrigin, readBoundedJson } from "../../../../../../../packages/ai-core/response.mjs";
import { resolveInquiry, escalateInquiry } from "../../../../../../../packages/ai-core/general-support.mjs";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{inquiryId:string}>}){
  try{
    requireJsonOrigin(request);
    const data=await readBoundedJson(request) as {storeId?:string;action?:string};
    if(data.action!=="resolve"&&data.action!=="escalate")
      return Response.json({error:"Unsupported support action"},{status:400});
    const scoped=await requireAiActor(request,"support.write",data.storeId);
    const actor={userId:scoped.id,role:scoped.role,storeIds:[scoped.storeId]};
    const id=(await params).inquiryId;
    return Response.json(data.action==="resolve"?await resolveInquiry(aiDb(),actor,id):await escalateInquiry(aiDb(),actor,id),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return apiFailure(error);}
}
