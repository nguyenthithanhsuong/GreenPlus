import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { orderFacade } from "../../../../backend/modules/orders/facades/order.facade";
import { PaymentMethod } from "../../../../backend/modules/orders/order.types";
import { logger } from "@/lib/logger"; 

type CreateOrderBody = {
  userId?: string;
  user_id?: string;
  deliveryAddress?: string;
  delivery_address?: string;
  deliveryFee?: number;
  delivery_fee?: number;
  note?: string;
  paymentMethod?: string;
  payment_method?: string;
};

export const GET = withSentry(async (request: Request) => {
  let userId = "";

  try {
    const { searchParams } = new URL(request.url);

    userId =
      searchParams.get("userId")?.trim() ??
      searchParams.get("user_id")?.trim() ??
      "";

    logger.info("Track orders attempt", { userId });

    if (!userId) {
      logger.error("Track orders failed - missing userId", {
        userId,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await orderFacade.trackMyOrders(userId);

    logger.info("Track orders success", {
      userId,
      count: Array.isArray(result) ? result.length : 0,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items: result }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Track orders failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    throw error;
  }
});

export const POST = withSentry(async (request: Request) => {
  let userId = "";

  try {
    const body = (await request.json()) as CreateOrderBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";

    const deliveryAddress =
      body.deliveryAddress?.trim() ??
      body.delivery_address?.trim() ??
      "";

    const deliveryFee = Number(
      body.deliveryFee ?? body.delivery_fee ?? 0
    );

    const note = body.note ?? "";

    const rawPaymentMethod = (
      body.paymentMethod?.trim() ??
      body.payment_method?.trim() ??
      "cod"
    ).toLowerCase();

    const paymentMethod: PaymentMethod =
      rawPaymentMethod === "momo" ||
      rawPaymentMethod === "vnpay" ||
      rawPaymentMethod === "bank_transfer"
        ? rawPaymentMethod
        : "cod";

    logger.info("Create order attempt", {
      userId,
      paymentMethod,
    });

    if (!userId || !deliveryAddress) {
      logger.error("Create order failed - missing required fields", {
        userId,
        deliveryAddress,
      });

      return NextResponse.json(
        { error: "userId and deliveryAddress are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await orderFacade.createOrderFromCart({
      userId,
      deliveryAddress,
      deliveryFee,
      note,
      paymentMethod,
    });

    logger.info("Create order success", {
      userId,
      paymentMethod,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create order failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    throw error;
  }
});