import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { deliveryTrackingFacade } from "../../../../../backend/modules/delivery-tracking/facades/delivery-tracking.facade";

export async function GET() {
  try {
    const items = await deliveryTrackingFacade.listShippers();
    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
