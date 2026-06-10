import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { orderFacade } from "../../../../backend/modules/orders/facades/order.facade";
import { logger } from "@/lib/logger";

export const GET = withSentry(async (request: Request) => {
  let userId = "";

  try {
    const { searchParams } = new URL(request.url);

    userId =
      searchParams.get("userId")?.trim() ??
      searchParams.get("user_id")?.trim() ??
      "";

    logger.info("Track payment history attempt", { userId });

    if (!userId) {
      logger.error("Track payment history failed - missing userId", {
        userId,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const items = await orderFacade.trackMyPaymentHistory(userId);

    logger.info("Track payment history success", {
      userId,
      count: Array.isArray(items) ? items.length : 0,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Track payment history failed", {
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