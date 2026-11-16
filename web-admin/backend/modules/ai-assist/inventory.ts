import { aiDb, resultOrFail } from "./db";
import type { AiSnapshot } from "./types";

const day = (date: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));

export async function inventorySnapshot(storeId: string): Promise<AiSnapshot> {
  const db = aiDb();
  const [productsQuery, batchesQuery, inventoryQuery, ordersQuery] = await Promise.all([
    db.from("products").select("product_id,name").eq("store_id",storeId).limit(250),
    db.from("batches").select("batch_id,product_id,expire_date,status").eq("store_id",storeId).limit(250),
    db.from("inventory").select("batch_id,quantity_available,quantity_reserved").eq("store_id",storeId).limit(250),
    db.from("orders").select("order_id,order_date,created_at,status").eq("store_id",storeId)
      .gte("order_date",new Date(Date.now()-90*86400000).toISOString()).order("order_date",{ascending:false}).limit(300),
  ]);
  const products = resultOrFail(productsQuery.data, productsQuery.error);
  const batches = resultOrFail(batchesQuery.data, batchesQuery.error);
  const inventory = resultOrFail(inventoryQuery.data, inventoryQuery.error);
  const orders = resultOrFail(ordersQuery.data, ordersQuery.error);
  const productNames = new Map(products.map((row) => [row.product_id, row.name]));
  const available = new Map(inventory.map((row) => [row.batch_id, Math.max(0, Number(row.quantity_available ?? 0))]));
  const orderIds = orders.filter((row) => row.status !== "cancelled").map((row) => row.order_id);
  const orderDates = new Map(orders.map((row) => [row.order_id, row.order_date ?? row.created_at]));
  const sales = new Map<string, Map<string, number>>();
  for (let index = 0; index < orderIds.length; index += 100) {
    const batch = orderIds.slice(index,index+100);
    if (!batch.length) continue;
    const {data,error} = await db.from("order_items").select("order_id,product_id,quantity")
      .eq("store_id",storeId).in("order_id",batch).limit(2000);
    const lines = resultOrFail(data,error);
    for (const line of lines) {
      const timestamp = orderDates.get(line.order_id);
      if (!timestamp || !line.product_id) continue;
      const date = day(timestamp);
      const current = sales.get(line.product_id) ?? new Map<string,number>();
      current.set(date,(current.get(date) ?? 0)+Math.max(0,Number(line.quantity ?? 0)));
      sales.set(line.product_id,current);
    }
  }
  return { store_id:storeId, source:"supabase", partial: products.length===250 || batches.length===250 || inventory.length===250 || orders.length===300,
    items:batches.filter((batch) => productNames.has(batch.product_id)).map((batch) => ({
      product_id:batch.product_id, batch_id:batch.batch_id, name:productNames.get(batch.product_id) ?? "Sản phẩm",
      available:available.get(batch.batch_id) ?? 0, expires_at:batch.expire_date,
      history:[...(sales.get(batch.product_id) ?? new Map())].map(([day,quantity]) => ({day,quantity})).sort((a,b)=>a.day.localeCompare(b.day)),
    })) };
}
