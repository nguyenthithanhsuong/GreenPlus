import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { orderTrackingFacade } from "../../../../../backend/modules/orders/facades/order-tracking.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  const { orderId } = await context.params;
  logger.info("Get order detail attempt", { orderId });

  try {
    const start = Date.now();
    const detail = await orderTrackingFacade.getOrderDetail(orderId);

    logger.info("Get order detail success", {
      orderId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Get order detail failed", { orderId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Get order detail unexpected error", { orderId, error: toErrorMessage(error) });
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
      note?: string;
      employeeId?: string;
    };

    logger.info("Update order status attempt", { 
      orderId, 
      status: body.status, 
      employeeId: body.employeeId 
    });

    const start = Date.now();
    const updated = await orderTrackingFacade.updateOrderStatus({
      orderId,
      status: body.status ?? "",
      note: body.note,
      employeeId: body.employeeId,
    });

    logger.info("Update order status success", {
      orderId,
      status: body.status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update order status failed", { orderId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update order status unexpected error", { orderId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
