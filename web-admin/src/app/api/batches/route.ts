import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { batchManagementFacade } from "../../../../backend/modules/batches/facades/batch-management.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  logger.info("List batches attempt");

  try {
    const start = Date.now();
    const items = await batchManagementFacade.listBatches();

    logger.info("List batches success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List batches failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List batches unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      supplierId?: string;
      harvestDate?: string;
      expireDate?: string;
      quantity?: number;
      importPrice?: number;
      qrCode?: string | null;
      status?: "pending" | "available" | "expired" | "sold_out";
      force?: boolean;
    };

    logger.info("Create batch attempt", { productId: body.productId, supplierId: body.supplierId });

    const start = Date.now();
    const created = await batchManagementFacade.createBatch({
      productId: body.productId ?? "",
      supplierId: body.supplierId ?? "",
      harvestDate: body.harvestDate ?? "",
      expireDate: body.expireDate ?? "",
      quantity: typeof body.quantity === "number" ? body.quantity : Number.NaN,
      importPrice: typeof body.importPrice === "number" ? body.importPrice : Number.NaN,
      qrCode: body.qrCode,
      status: body.status,
      force: body.force === true,
    });

    logger.info("Create batch success", {
      batchId: created.batch_id,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create batch failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Create batch unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}