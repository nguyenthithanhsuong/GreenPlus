import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { deliveryTrackingFacade } from "../../../../../backend/modules/delivery-tracking/facades/delivery-tracking.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  logger.info("List shippers attempt");

  try {
    const start = Date.now();
    const items = await deliveryTrackingFacade.listShippers();

    logger.info("List shippers success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List shippers failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List shippers unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}