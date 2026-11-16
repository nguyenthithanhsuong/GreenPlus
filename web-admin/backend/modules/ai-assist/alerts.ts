import { aiDb } from "./db";
import { AiError } from "./errors";
import type { AiActor,AiForecast } from "./types";

type AlertKind="low_stock"|"near_expiry"|"overstock";
export async function persistAiAlerts(actor:AiActor,forecasts:AiForecast[]){
 const db=aiDb();let created=0;
 const existing=await db.from("inventory_alerts").select("id,product_id,batch_id,type").eq("store_id",actor.storeId).eq("status","open").limit(300);
 if(existing.error)throw new AiError("Không truy cập được cảnh báo kho",503);
 const seen=new Set((existing.data??[]).map(a=>`${a.product_id}:${a.batch_id}:${a.type}`));
 const records:Record<string,unknown>[]=[];
 for(const row of forecasts){
  for(const type of row.alerts as AlertKind[]){
   if(!["low_stock","near_expiry","overstock"].includes(type))continue;
   const key=`${row.product_id}:${row.batch_id}:${type}`;
   if(seen.has(key))continue;seen.add(key);
   records.push({store_id:actor.storeId,product_id:row.product_id,batch_id:row.batch_id,type,
    severity:type==="near_expiry"&&row.days_to_expiry!==null&&row.days_to_expiry<=2?"high":"medium",
    days_to_expiry:row.days_to_expiry,predicted_stockout_date:row.stockout_date,
    model_version:row.model_version,status:"open"});
  }
 }
 if(records.length){const inserted=await db.from("inventory_alerts").insert(records);if(inserted.error)throw new AiError("Không lưu được cảnh báo kho",503);created=records.length;}
 return created;
}
