import { NextResponse } from "next/server";
import {
  requireShipper,
  listMyDeliveries,
  ShipperDeliveryError,
} from "../../../../../backend/modules/delivery-tracking/shipper-delivery.service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const employeeId = await requireShipper(request);
    const items = await listMyDeliveries(employeeId);
    return NextResponse.json(
      { items, total: items.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ShipperDeliveryError
            ? error.message
            : "Unexpected error",
      },
      {
        status: error instanceof ShipperDeliveryError ? error.status : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
