import { callAiService } from "../../../../packages/ai-core/ai-client.mjs";
import { assertSameStore } from "../../../../packages/ai-core/policy.mjs";
import { aiDb, resultOrFail } from "./db";
import { AiError } from "./errors";
import { inventorySnapshot } from "./inventory";
import { consumeAiQuota } from "./quota";
import { persistAiAlerts } from "./alerts";
import type { AiActor, AiForecast } from "./types";

export async function forecastStore(actor: AiActor, persist: boolean) {
  if (persist) await consumeAiQuota(actor, "forecast");
  const snapshot = await inventorySnapshot(actor.storeId);
  if (!snapshot.items.length) return { items: [], partial: snapshot.partial, source: snapshot.source, status: "no_inventory" };
  const response = await callAiService("forecast", { store_id: actor.storeId, items: snapshot.items });
  assertSameStore(actor.storeId, String(response.store_id ?? ""));
  if (!Array.isArray(response.items)) throw new AiError("Phản hồi dự báo không hợp lệ", 503);
  const rows = response.items as AiForecast[];
  const allowed = new Set(snapshot.items.map((item) => `${item.product_id}:${item.batch_id}`));
  if (rows.some((row) => row.store_id !== actor.storeId || !allowed.has(`${row.product_id}:${row.batch_id}`)))
    throw new AiError("Dữ liệu dự báo sai phạm vi cửa hàng", 503);
  if (persist && rows.length) {
    const data = rows.map((row) => ({ store_id: actor.storeId, product_id: row.product_id, batch_id: row.batch_id,
      available:row.available, predicted_daily_units:row.predicted_daily_units,
      predicted_14d_units:row.predicted_14d_units, predicted_stockout_date:row.stockout_date,
      days_to_expiry:row.days_to_expiry, training_days:row.training_days, validation_mae:row.validation_mae,
      confidence:row.confidence, model_version:row.model_version }));
    const inserted = await aiDb().from("ai_forecasts").insert(data);
    if (inserted.error) throw new AiError("Không lưu được dự báo", 503);
    await persistAiAlerts(actor,rows);
  }
  return { items: rows, partial:snapshot.partial, source:snapshot.source, status:"estimated", as_of:response.as_of };
}
export async function latestForecasts(storeId:string) {
  const {data,error} = await aiDb().from("ai_forecasts").select("*").eq("store_id",storeId)
    .order("created_at",{ascending:false}).limit(200);
  return resultOrFail(data,error);
}
