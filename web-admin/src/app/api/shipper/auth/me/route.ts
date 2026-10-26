import { NextResponse } from "next/server";
import {
  requireShipper,
  ShipperDeliveryError,
} from "../../../../../../backend/modules/delivery-tracking/shipper-delivery.service";
import { createServiceRoleSupabaseClient } from "../../../../../../backend/core/supabase";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const id = await requireShipper(request);
    const { data, error } = await createServiceRoleSupabaseClient()
      .from("users")
      .select("user_id,name,email,phone,status")
      .eq("user_id", id)
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Không thể tải hồ sơ" },
        { status: 503 },
      );
    return NextResponse.json(
      { user: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Phiên hết hạn hoặc không hợp lệ" },
      { status: e instanceof ShipperDeliveryError ? e.status : 401 },
    );
  }
}
