import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { orderTrackingFacade } from "../../../../backend/modules/orders/facades/order-tracking.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async (request: Request) => {
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") ?? undefined;
  const fromDate = searchParams.get("fromDate") ?? undefined;
  const toDate = searchParams.get("toDate") ?? undefined;

  logger.info("List orders attempt", {
    status,
    fromDate,
    toDate,
  });

  const start = Date.now();

  const items = await orderTrackingFacade.listOrders({
    status,
    fromDate,
    toDate,
  });

  logger.info("List orders success", {
    count: items.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    {
      items,
      total: items.length,
    },
    { status: 200 },
  );
});