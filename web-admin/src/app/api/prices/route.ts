import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { priceManagementFacade } from "../../../../backend/modules/prices/facades/price-management.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async () => {
  logger.info("List prices attempt");

  const start = Date.now();

  const items = await priceManagementFacade.listPrices();

  logger.info("List prices success", {
    count: items.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    { items, total: items.length },
    { status: 200 },
  );
});

export const POST = withSentry(async (request: Request) => {
  const body = (await request.json()) as {
    batchId?: string | null;
    price?: number;
    date?: string;
  };

  logger.info("Create price attempt", {
    batchId: body.batchId,
  });

  const start = Date.now();

  const created = await priceManagementFacade.createPrice({
    batchId: body.batchId,
    price: Number(body.price),
    date: String(body.date ?? ""),
  });

  logger.info("Create price success", {
    priceId: created.price_id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(created, { status: 201 });
});