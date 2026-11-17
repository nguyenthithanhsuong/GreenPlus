import { aiDb, resultOrFail } from "./db";

export async function aiInsights(storeId:string) {
  const db=aiDb();
  const [forecast,alerts,suggestions,triage,knowledge]=await Promise.all([
    db.from("ai_forecasts").select("product_id,available,predicted_daily_units,confidence,created_at").eq("store_id",storeId).order("created_at",{ascending:false}).limit(150),
    db.from("inventory_alerts").select("id,type,severity,status,created_at").eq("store_id",storeId).eq("status","open").limit(100),
    db.from("promotion_suggestions").select("id,status,created_at").eq("store_id",storeId).limit(100),
    db.from("ai_complaint_triage").select("complaint_id,priority,created_at").eq("store_id",storeId).limit(100),
    db.from("ai_knowledge").select("id").eq("store_id",storeId).eq("enabled",true).limit(100),
  ]);
  // Preserve each Supabase query's row type. Mapping heterogeneous results into
  // one array erases per-table fields and makes TypeScript infer a broad union.
  const forecasts = resultOrFail(forecast.data, forecast.error);
  const activeAlerts = resultOrFail(alerts.data, alerts.error);
  const proposals = resultOrFail(suggestions.data, suggestions.error);
  const complaints = resultOrFail(triage.data, triage.error);
  const faqs = resultOrFail(knowledge.data, knowledge.error);
  return {
    forecasts:forecasts.length,lowConfidence:forecasts.filter((row)=>row.confidence==="low").length,
    alerts:activeAlerts.length,alertTypes:["low_stock","near_expiry","overstock"].map((type)=>({type,count:activeAlerts.filter((row)=>row.type===type).length})),
    suggestions:proposals.length,pending:proposals.filter((row)=>row.status==="pending").length,
    approved:proposals.filter((row)=>row.status==="accepted").length,
    complaints:complaints.length,knowledgeEntries:faqs.length,
    trend:forecasts.slice(0,60).reverse().map((row)=>({time:row.created_at,value:row.predicted_daily_units})),
    source:"supabase",partial:forecasts.length===150 || activeAlerts.length===100 || proposals.length===100 || complaints.length===100 || faqs.length===100,
  };
}
