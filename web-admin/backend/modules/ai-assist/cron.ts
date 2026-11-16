import { aiDb } from "./db";
import { forecastStore } from "./forecasts";
import { generateSuggestions } from "./promotions";
import type { AiActor } from "./types";
import { AiError } from "./errors";

export async function runAiMaintenance(){
 const db=aiDb();
 const {data,error}=await db.from("stores").select("store_id,manager_id").eq("status","active").order("store_id").limit(31);
 if(error)throw new AiError("Không đọc được cửa hàng",503);
 if((data??[]).length>30)throw new AiError("Số cửa hàng vượt giới hạn chạy định kỳ; cần phân trang",503);
 const results:{storeId:string;ok:boolean;error?:string;forecastCount?:number;suggestionCount?:number}[]=[];
 for(const item of data??[]){
  const id=item.manager_id;
  if(!id){results.push({storeId:item.store_id,ok:false,error:"Cửa hàng thiếu Manager"});continue;}
  const {data:manager,error:managerError}=await db.from("users").select("user_id,status,roles(is_manager)").eq("user_id",id).maybeSingle();
  const role=Array.isArray(manager?.roles)?manager.roles[0]:manager?.roles;
  if(managerError||!manager||manager.status!=="active"||!role?.is_manager){results.push({storeId:item.store_id,ok:false,error:"Manager không hoạt động"});continue;}
  const actor:AiActor={id,role:"manager",storeId:item.store_id};
  try{const fore=await forecastStore(actor,true);const promos=await generateSuggestions(actor);results.push({storeId:actor.storeId,ok:true,forecastCount:fore.items.length,suggestionCount:promos.created});}
  catch(e){results.push({storeId:item.store_id,ok:false,error:e instanceof Error?e.message:"Không chạy được AI"});}
 }
 return {ok:results.every(x=>x.ok),stores:results.length,results};
}
