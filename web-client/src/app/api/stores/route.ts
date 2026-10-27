import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../backend/core/supabase";
export const runtime = "nodejs";
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("stores")
      .select(
        "store_id,name,address,ward,district,city,latitude,longitude,opening_time,closing_time,status",
      )
      .eq("status", "active")
      .order("name");
    if (error) throw error;
    return NextResponse.json(
      { items: data ?? [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể tải danh sách cửa hàng" },
      { status: 503 },
    );
  }
}
