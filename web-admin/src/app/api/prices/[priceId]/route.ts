import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { priceManagementFacade } from "../../../../../backend/modules/prices/facades/price-management.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    priceId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  const { priceId } = await context.params;
  const force = new URL(request.url).searchParams.get("force") === "true";

  logger.info("Update price attempt", { priceId, force });

  try {
    const body = (await request.json()) as {
      batchId?: string | null;
      price?: number;
      date?: string;
      status?: "pending" | "active" | "inactive" | null;
    };

    const start = Date.now();
    const updated = await priceManagementFacade.updatePrice({
      priceId,
      batchId: body.batchId,
      price: typeof body.price === "number" ? Number(body.price) : undefined,
      date: typeof body.date === "string" ? body.date : undefined,
      status: typeof body.status === "string" ? body.status : body.status === null ? null : undefined,
      force,
    });

    logger.info("Update price success", {
      priceId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update price failed", { priceId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update price unexpected error", { priceId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  const { priceId } = await context.params;
  const force = new URL(request.url).searchParams.get("force") === "true";

  logger.info("Delete price attempt", { priceId, force });

  try {
    const start = Date.now();
    await priceManagementFacade.deletePrice(priceId, force);
    
    logger.info("Delete price success", {
      priceId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete price failed", { priceId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Delete price unexpected error", { priceId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
