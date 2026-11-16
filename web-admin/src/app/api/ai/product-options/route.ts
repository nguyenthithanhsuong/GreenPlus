import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiDb, resultOrFail } from "../../../../../backend/modules/ai-assist/db";
import { aiErrorResponse } from "../../../../../backend/modules/ai-assist/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const storeId = new URL(request.url).searchParams.get("storeId");
    const actor = await requireAiActor(request, "promotion.decide", storeId);
    const db = aiDb();
    const today = new Date().toISOString().slice(0, 10);
    const [products, batches] = await Promise.all([
      db.from("products")
        .select("product_id,name")
        .eq("store_id", actor.storeId)
        .eq("status", "active")
        .order("name", { ascending: true })
        .limit(200),
      db.from("batches")
        .select("batch_id,product_id,expire_date")
        .eq("store_id", actor.storeId)
        .eq("status", "available")
        .gte("expire_date", today)
        .order("expire_date", { ascending: true })
        .limit(250),
    ]);
    return Response.json({
      products: resultOrFail(products.data, products.error),
      batches: resultOrFail(batches.data, batches.error),
      partial: (products.data?.length ?? 0) >= 200 || (batches.data?.length ?? 0) >= 250,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
