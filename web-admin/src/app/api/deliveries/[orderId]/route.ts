import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { deliveryTrackingFacade } from "../../../../../backend/modules/delivery-tracking/facades/delivery-tracking.facade";
import type { DeliveryStatus } from "../../../../../backend/modules/delivery-tracking/delivery-tracking.types";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

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
  const { orderId } = await context.params;
  logger.info("Get delivery detail attempt", { orderId });

  try {
    const start = Date.now();
    const detail = await deliveryTrackingFacade.getDeliveryDetail(orderId);
    
    logger.info("Get delivery detail success", {
      orderId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Get delivery detail failed", { orderId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Get delivery detail unexpected error", { orderId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  const { orderId } = await context.params;

  try {
    const body = (await request.json()) as {
      status?: string;
      employeeId?: string;
      note?: string;
    };

    logger.info("Update delivery status attempt", { orderId, status: body.status });

    const start = Date.now();
    const updated = await deliveryTrackingFacade.updateDeliveryStatus({
      orderId,
      employeeId: body.employeeId,
      status: parseDeliveryStatus(body.status),
      note: body.note,
    });

    logger.info("Update delivery status success", {
      orderId,
      status: body.status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update delivery status failed", { orderId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update delivery status unexpected error", { orderId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
