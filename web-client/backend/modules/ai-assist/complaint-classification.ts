import { supabaseServer } from "../../core/supabase";
import { callAiService } from "../../../../packages/ai-core/ai-client.mjs";
import { validUuid } from "../../../../packages/ai-core/policy.mjs";

export async function classifyNewComplaint(complaintId:string,orderId:string,userId:string,description:string){
 if(!validUuid(complaintId)||!validUuid(orderId)||!validUuid(userId))throw new Error("Invalid complaint identity");
 const result=await supabaseServer.from("orders").select("store_id").eq("order_id",orderId).eq("user_id",userId).maybeSingle();
 if(result.error||!result.data?.store_id)throw new Error("Complaint store unavailable");
 const storeId=String(result.data.store_id);
 const evaluated=await callAiService("complaints",{store_id:storeId,text:description});
 if(!["normal","medium","high"].includes(String(evaluated.priority))||typeof evaluated.category!=="string")throw new Error("Invalid AI category");
 const confidence=Number(evaluated.confidence);
 if(!Number.isFinite(confidence)||confidence<0||confidence>1)throw new Error("Invalid AI confidence");
 const saved=await supabaseServer.from("ai_complaint_triage").upsert({store_id:storeId,complaint_id:complaintId,
  category:String(evaluated.category).slice(0,80),priority:evaluated.priority,confidence,
  model_version:String(evaluated.mode??"transparent_rules").slice(0,80)},
  {onConflict:"complaint_id"});
 if(saved.error)throw new Error("AI classification unavailable");
 return {status:"suggested",requiresHumanReview:true};
}
