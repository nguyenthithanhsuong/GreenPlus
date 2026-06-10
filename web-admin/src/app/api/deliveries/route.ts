import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";

import { AppError } from "../../../../backend/core/errors";
import { deliveryTrackingFacade } from "../../../../backend/modules/delivery-tracking/facades/delivery-tracking.facade";
import type { DeliveryStatus } from "../../../../backend/modules/delivery-tracking/delivery-tracking.types";
import { logger } from "@/lib/logger"; 

const parseDeliveryStatus = (
  value: string | null,
): DeliveryStatus | undefined => {
  if (!value) {
    return undefined;
  }

  if (
    value === "assigned" ||
    value === "picked_up" ||
    value === "delivering" ||
    value === "delivered"
  ) {
    return value;
  }

  throw new AppError("Unsupported delivery status filter", 400);
};

export const GET = withSentry(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const status = parseDeliveryStatus(searchParams.get("status"));

  logger.info("List deliveries attempt", {
    status,
    employeeId: searchParams.get("employeeId"),
  });

  const start = Date.now();

  const items = await deliveryTrackingFacade.listDeliveries({
    status,
    fromDate: searchParams.get("fromDate") ?? undefined,
    toDate: searchParams.get("toDate") ?? undefined,
    employeeId: searchParams.get("employeeId") ?? undefined,
  });

  logger.info("List deliveries success", {
    count: items.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    { items, total: items.length },
    { status: 200 },
  );
});

export const POST = withSentry(async (request: Request) => {
  const body = (await request.json()) as {
    orderId?: string;
    employeeId?: string;
    note?: string;
    status?: string;
  };

  logger.info("Assign shipper attempt", {
    orderId: body.orderId,
    employeeId: body.employeeId,
  });

  const start = Date.now();

  const assigned = await deliveryTrackingFacade.assignShipper({
    orderId: body.orderId ?? "",
    employeeId: body.employeeId ?? "",
    note: body.note,
  });

  const nextStatus = body.status
    ? parseDeliveryStatus(body.status)
    : undefined;

  if (nextStatus) {
    const updated = await deliveryTrackingFacade.updateDeliveryStatus({
      orderId: assigned.order_id,
      employeeId: assigned.employee_id ?? undefined,
      status: nextStatus,
      note: body.note,
    });

    logger.info("Assign shipper and update status success", {
      orderId: assigned.order_id,
      status: nextStatus,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 201 });
  }

  logger.info("Assign shipper success", {
    orderId: assigned.order_id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(assigned, { status: 201 });
});