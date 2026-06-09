import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { orderTrackingFacade } from "../../../../backend/modules/orders/facades/order-tracking.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const fromDate = searchParams.get("fromDate") ?? undefined;
  const toDate = searchParams.get("toDate") ?? undefined;

  logger.info("List orders attempt", { status, fromDate, toDate });

  try {
    const start = Date.now();
    const items = await orderTrackingFacade.listOrders({ status, fromDate, toDate });

    logger.info("List orders success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List orders failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List orders unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
