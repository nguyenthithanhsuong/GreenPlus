import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";

import { deliveryTrackingFacade } from "../../../../../backend/modules/delivery-tracking/facades/delivery-tracking.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async () => {
  logger.info("List shippers attempt");

  const start = Date.now();

  const items = await deliveryTrackingFacade.listShippers();

  logger.info("List shippers success", {
    count: items.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    { items, total: items.length },
    { status: 200 },
  );
});