import { NextResponse } from "next/server";
import { portalActor } from "../../../../../../backend/core/manager-scope";
import { createServiceRoleSupabaseClient } from "../../../../../../backend/core/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(request: Request) {
  try {
    const actor = await portalActor(request);
    if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
    const id = new URL(request.url).searchParams.get("storeId") ?? "";
    if (!uuid.test(id)) return NextResponse.json({ error: "Cửa hàng không hợp lệ" }, { status: 400, headers });
    const db = createServiceRoleSupabaseClient();
    const { data: store, error } = await db.from("stores").select("store_id,name,status")
      .eq("store_id", id).maybeSingle();
    if (error || !store) return NextResponse.json({ error: "Không tìm thấy cửa hàng" }, { status: 404, headers });
    const [products, orders, promotions, inventory] = await Promise.all([
      db.from("products").select("product_id", { head: true, count: "exact" }).eq("store_id", id),
      db.from("orders").select("order_id", { head: true, count: "exact" }).eq("store_id", id),
      db.from("promotions").select("id", { head: true, count: "exact" }).eq("store_id", id).eq("status", "active"),
      db.from("inventory").select("inventory_id", { head: true, count: "exact" }).eq("store_id", id),
    ]);
    if ([products,orders,promotions,inventory].some(row => row.error)) {
      return NextResponse.json({ error: "Không thể thống kê cửa hàng" }, { status: 503, headers });
    }
    return NextResponse.json({ store, stats: {
      products: products.count ?? 0, orders: orders.count ?? 0,
      promotions: promotions.count ?? 0, inventory: inventory.count ?? 0,
    }}, { headers });
  } catch { return NextResponse.json({ error: "Không có quyền hoặc phiên hết hạn" }, { status: 403, headers }); }
}
