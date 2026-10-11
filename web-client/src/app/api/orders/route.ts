import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { orderFacade } from "../../../../backend/modules/orders/facades/order.facade";
import { PaymentMethod } from "../../../../backend/modules/orders/order.types";
import {
  assertCustomerId,
  requireCustomerIdentity,
} from "../../../../backend/core/request-auth";
import { logger } from "@/lib/logger";
import { resolveStoreContext } from "../../../../backend/core/store-context";

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
  storeId?: string;
  idempotencyKey?: string;
};

export const GET = withSentry(async (request: Request) => {
  const identity = requireCustomerIdentity(request);
  let userId = "";

  try {
    const { searchParams } = new URL(request.url);
    const store = await resolveStoreContext(
      searchParams.get("storeId"),
      identity,
    );

    userId = assertCustomerId(
      searchParams.get("userId") ?? searchParams.get("user_id") ?? undefined,
      identity.userId,
    );

    logger.info("Track orders attempt", { userId });

    if (!userId) {
      logger.error("Track orders failed - missing userId", {
        userId,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const start = Date.now();

    const result = await orderFacade.trackMyOrders(userId, store.storeId);

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
        { status: error.statusCode },
      );
    }

    throw error;
  }
});

export const POST = withSentry(async (request: Request) => {
  const identity = requireCustomerIdentity(request);
  let userId = "";

  try {
    const body = (await request.json()) as CreateOrderBody;
    const store = await resolveStoreContext(body.storeId, identity);
    const idempotencyKey =
      request.headers.get("Idempotency-Key")?.trim() ??
      body.idempotencyKey?.trim() ??
      "";

    userId = assertCustomerId(body.userId ?? body.user_id, identity.userId);

    const deliveryAddress =
      body.deliveryAddress?.trim() ?? body.delivery_address?.trim() ?? "";

    const deliveryFee = Number(body.deliveryFee ?? body.delivery_fee ?? 0);

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
        { status: 400 },
      );
    }

    const start = Date.now();

    const result = await orderFacade.createOrderFromCart({
      userId,
      storeId: store.storeId,
      idempotencyKey,
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
        { status: error.statusCode },
      );
    }

    throw error;
  }
});
