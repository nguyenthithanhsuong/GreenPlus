export type AiRole = "admin" | "manager" | "employee" | "shipper" | "customer";
export type AiActor = { id: string; role: AiRole; storeId: string };
export type AiForecast = {
  store_id: string; product_id: string; batch_id: string | null; name: string;
  available: number; days_to_expiry: number | null;
  predicted_daily_units: number; predicted_14d_units: number;
  stockout_date: string | null; confidence: "low" | "medium" | "high";
  model_version: string; training_days: number; validation_mae: number | null;
  alerts: string[];
};
export type AiSnapshot = {
  store_id: string; source: string; partial: boolean;
  items: { product_id: string; batch_id: string | null; name: string; available: number; expires_at: string | null; history: { day: string; quantity: number }[] }[];
};
