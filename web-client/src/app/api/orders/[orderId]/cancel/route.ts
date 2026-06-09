import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { orderFacade } from "../../../../../../backend/modules/orders/facades/order.facade";
import { logger } from "../../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

type CancelBody = {
  userId?: string;
  user_id?: string;
  note?: string;
};

export async function PUT(request: Request, context: Context) {
  let userId = "";
  let orderId = "";

  try {
    const { orderId: id } = await context.params;
    orderId = id;

    const body = (await request.json()) as CancelBody;
    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";

    logger.info("Cancel order attempt", {
      userId,
      orderId,
    });

    if (!userId) {
      logger.error("Cancel order failed - missing userId", {
        userId,
        orderId,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await orderFacade.cancelOrder({
      userId,
      orderId,
      note: body.note ?? "",
    });

    logger.info("Cancel order success", {
      userId,
      orderId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Cancel order failed", {
        userId,
        orderId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Cancel order unexpected error", {
      userId,
      orderId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}