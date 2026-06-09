import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { orderFacade } from "../../../../../backend/modules/orders/facades/order.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

type UpdateOrderBody = {
  userId?: string;
  user_id?: string;
  deliveryAddress?: string;
  delivery_address?: string;
  deliveryFee?: number;
  delivery_fee?: number;
  note?: string;
};

export async function GET(request: Request, context: Context) {
  let userId = "";
  let orderId = "";

  try {
    const { searchParams } = new URL(request.url);

    userId =
      searchParams.get("userId")?.trim() ??
      searchParams.get("user_id")?.trim() ??
      "";

    const params = await context.params;
    orderId = params.orderId;

    logger.info("Get order detail attempt", { userId, orderId });

    if (!userId) {
      logger.error("Get order detail failed - missing userId", {
        userId,
        orderId,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const detail = await orderFacade.getOrderDetail(userId, orderId);

    logger.info("Get order detail success", {
      userId,
      orderId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Get order detail failed", {
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

    logger.error("Get order detail unexpected error", {
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

export async function PUT(request: Request, context: Context) {
  let userId = "";
  let orderId = "";

  try {
    const body = (await request.json()) as UpdateOrderBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const deliveryAddress =
      body.deliveryAddress?.trim() ??
      body.delivery_address?.trim();

    const deliveryFeeRaw =
      body.deliveryFee ?? body.delivery_fee;

    const note = body.note;

    const params = await context.params;
    orderId = params.orderId;

    logger.info("Update order attempt", { userId, orderId });

    if (!userId) {
      logger.error("Update order failed - missing userId", {
        userId,
        orderId,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await orderFacade.updateOrder({
      userId,
      orderId,
      deliveryAddress,
      deliveryFee:
        typeof deliveryFeeRaw === "undefined"
          ? undefined
          : Number(deliveryFeeRaw),
      note,
    });

    logger.info("Update order success", {
      userId,
      orderId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update order failed", {
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

    logger.error("Update order unexpected error", {
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