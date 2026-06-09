import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { priceManagementFacade } from "../../../../backend/modules/prices/facades/price-management.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  logger.info("List prices attempt");

  try {
    const start = Date.now();
    const items = await priceManagementFacade.listPrices();

    logger.info("List prices success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List prices failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List prices unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      batchId?: string | null;
      price?: number;
      date?: string;
    };

    logger.info("Create price attempt", { batchId: body.batchId });

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
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create price failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Create price unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
