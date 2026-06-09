import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { subscriptionFacade } from "../../../../backend/modules/subscriptions/facades/subscription.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

type SubscriptionBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  frequency?: string;
  schedule?: string;
  status?: string;
  startDate?: string;
  start_date?: string;
  subscriptionId?: string;
  subscription_id?: string;
};

export async function GET(request: Request) {
  const start = Date.now();
  let userId = "";

  try {
    const url = new URL(request.url);
    userId = (url.searchParams.get("userId") ?? url.searchParams.get("user_id") ?? "").trim();

    logger.info("List subscriptions attempt", { userId });

    if (!userId) {
      logger.error("List subscriptions failed - missing userId", { userId });

      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const result = await subscriptionFacade.listByUserId(userId);

    logger.info("List subscriptions success", {
      userId,
      count: Array.isArray(result) ? result.length : 0,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ subscriptions: result }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List subscriptions failed (AppError)", {
        userId,
        message: error.message,
        status: error.statusCode,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List subscriptions unexpected error", {
      userId,
      error: toErrorMessage(error),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const start = Date.now();

  try {
    const body = (await request.json()) as SubscriptionBody;

    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const frequency = body.frequency?.trim() ?? "";

    logger.info("Subscribe attempt", { userId, productId, frequency });

    if (!userId || !productId || !frequency) {
      logger.error("Subscribe failed - missing required fields", {
        userId,
        productId,
        frequency,
      });

      return NextResponse.json(
        { error: "userId, productId and frequency are required" },
        { status: 400 }
      );
    }

    const result = await subscriptionFacade.subscribe({
      userId,
      productId,
      frequency,
    });

    logger.info("Subscribe success", {
      userId,
      productId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Subscribe failed (AppError)", {
        message: error.message,
        status: error.statusCode,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Subscribe unexpected error", {
      error: toErrorMessage(error),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const start = Date.now();

  try {
    const body = (await request.json()) as SubscriptionBody;

    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const subscriptionId = body.subscriptionId?.trim() ?? body.subscription_id?.trim() ?? "";

    logger.info("Unsubscribe attempt", { userId, subscriptionId });

    if (!userId || !subscriptionId) {
      logger.error("Unsubscribe failed - missing required fields", {
        userId,
        subscriptionId,
      });

      return NextResponse.json(
        { error: "userId and subscriptionId are required" },
        { status: 400 }
      );
    }

    const result = await subscriptionFacade.unsubscribe({
      userId,
      subscriptionId,
    });

    logger.info("Unsubscribe success", {
      userId,
      subscriptionId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Unsubscribe failed (AppError)", {
        message: error.message,
        status: error.statusCode,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Unsubscribe unexpected error", {
      error: toErrorMessage(error),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const start = Date.now();

  try {
    const body = (await request.json()) as SubscriptionBody;

    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const subscriptionId = body.subscriptionId?.trim() ?? body.subscription_id?.trim() ?? "";
    const frequency = body.frequency?.trim() ?? body.schedule?.trim() ?? "";
    const status = body.status?.trim() ?? "";
    const startDate = body.startDate?.trim() ?? body.start_date?.trim() ?? "";

    logger.info("Update subscription attempt", {
      userId,
      subscriptionId,
      frequency,
      status,
      startDate,
    });

    if (!userId || !subscriptionId) {
      logger.error("Update subscription failed - missing required fields", {
        userId,
        subscriptionId,
      });

      return NextResponse.json(
        { error: "userId and subscriptionId are required" },
        { status: 400 }
      );
    }

    const result = await subscriptionFacade.updateSubscription({
      userId,
      subscriptionId,
      frequency: frequency || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
    });

    logger.info("Update subscription success", {
      userId,
      subscriptionId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update subscription failed (AppError)", {
        message: error.message,
        status: error.statusCode,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update subscription unexpected error", {
      error: toErrorMessage(error),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}