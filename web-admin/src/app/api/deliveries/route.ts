import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { deliveryTrackingFacade } from "../../../../backend/modules/delivery-tracking/facades/delivery-tracking.facade";
import type { DeliveryStatus } from "../../../../backend/modules/delivery-tracking/delivery-tracking.types";

const parseDeliveryStatus = (value: string | null): DeliveryStatus | undefined => {
  if (!value) {
    return undefined;
  }

  if (value === "assigned" || value === "picked_up" || value === "delivering" || value === "delivered") {
    return value;
  }

  throw new AppError("Unsupported delivery status filter", 400);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = parseDeliveryStatus(searchParams.get("status"));
    const fromDate = searchParams.get("fromDate") ?? undefined;
    const toDate = searchParams.get("toDate") ?? undefined;
    const employeeId = searchParams.get("employeeId") ?? undefined;

    const items = await deliveryTrackingFacade.listDeliveries({ status, fromDate, toDate, employeeId });
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      employeeId?: string;
      note?: string;
      status?: string;
    };

    const assigned = await deliveryTrackingFacade.assignShipper({
      orderId: body.orderId ?? "",
      employeeId: body.employeeId ?? "",
      note: body.note,
    });

    const nextStatus = body.status ? parseDeliveryStatus(body.status) : undefined;

    if (nextStatus) {
      const updated = await deliveryTrackingFacade.updateDeliveryStatus({
        orderId: assigned.order_id,
        employeeId: assigned.employee_id ?? undefined,
        status: nextStatus,
        note: body.note,
      });

      return NextResponse.json(updated, { status: 201 });
    }

    return NextResponse.json(assigned, { status: 201 });
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