import { NextResponse } from "next/server";
import { requireShipper, advanceMyDelivery, ShipperDeliveryError } from "../../../../../../../backend/modules/delivery-tracking/shipper-delivery.service";
export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const employeeId = await requireShipper(request);
    const { orderId } = await context.params;
    const body = await request.json().catch(() => null);
    const item = await advanceMyDelivery(employeeId, orderId, body?.status);
    return NextResponse.json(item, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof ShipperDeliveryError ? error.message : "Unexpected error" },
      { status: error instanceof ShipperDeliveryError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
  }
}
