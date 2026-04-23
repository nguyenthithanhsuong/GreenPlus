import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { deliveryTrackingFacade } from "../../../../backend/modules/delivery-tracking/facades/delivery-tracking.facade";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const fromDate = searchParams.get("fromDate") ?? undefined;
    const toDate = searchParams.get("toDate") ?? undefined;

    const items = await deliveryTrackingFacade.listDeliveries({ status, fromDate, toDate });
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