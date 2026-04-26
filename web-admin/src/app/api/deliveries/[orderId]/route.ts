import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { deliveryTrackingFacade } from "../../../../../backend/modules/delivery-tracking/facades/delivery-tracking.facade";
import type { DeliveryStatus } from "../../../../../backend/modules/delivery-tracking/delivery-tracking.types";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

const parseDeliveryStatus = (value: string | undefined): DeliveryStatus => {
  if (value === "assigned" || value === "picked_up" || value === "delivering" || value === "delivered") {
    return value;
  }

  throw new AppError("Unsupported delivery status", 400);
};

export async function GET(_: Request, context: Context) {
  try {
    const { orderId } = await context.params;
    const detail = await deliveryTrackingFacade.getDeliveryDetail(orderId);
    return NextResponse.json(detail, { status: 200 });
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

export async function PATCH(request: Request, context: Context) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as {
      status?: string;
      employeeId?: string;
      note?: string;
    };

    const updated = await deliveryTrackingFacade.updateDeliveryStatus({
      orderId,
      employeeId: body.employeeId,
      status: parseDeliveryStatus(body.status),
      note: body.note,
    });

    return NextResponse.json(updated, { status: 200 });
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