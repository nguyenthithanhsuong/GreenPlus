import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { batchManagementFacade } from "../../../../../backend/modules/batches/facades/batch-management.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    batchId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  const start = Date.now();
  let batchId = "";

  try {
    const { batchId: id } = await context.params;
    batchId = id;

    const body = (await request.json()) as {
      productId?: string;
      supplierId?: string;
      harvestDate?: string;
      expireDate?: string;
      quantity?: number;
      importPrice?: number;
      qrCode?: string | null;
      status?: "pending" | "available" | "rejected" | "expired" | "sold_out";
      force?: boolean;
    };

    logger.info("Update batch attempt", { batchId });

    const updated = await batchManagementFacade.updateBatch({
      batchId,
      productId: body.productId,
      supplierId: body.supplierId,
      harvestDate: body.harvestDate,
      expireDate: body.expireDate,
      quantity: body.quantity,
      importPrice: body.importPrice,
      qrCode: body.qrCode,
      status: body.status,
      force: body.force === true,
    });

    logger.info("Update batch success", {
      batchId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update batch failed (AppError)", {
        batchId,
        message: error.message,
        status: error.statusCode,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update batch unexpected error", {
      batchId,
      error: toErrorMessage(error),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  const start = Date.now();
  let batchId = "";

  try {
    const { batchId: id } = await context.params;
    batchId = id;

    const body = (await request.json()) as {
      status?: "pending" | "available" | "rejected" | "expired" | "sold_out";
    };

    logger.info("Change batch status attempt", { batchId });

    if (!body.status) {
      logger.error("Change batch status failed - missing status", { batchId });

      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const updated = await batchManagementFacade.changeStatus(batchId, body.status);

    logger.info("Change batch status success", {
      batchId,
      status: body.status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Change batch status failed (AppError)", {
        batchId,
        message: error.message,
        status: error.statusCode,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Change batch status unexpected error", {
      batchId,
      error: toErrorMessage(error),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  const start = Date.now();
  let batchId = "";

  try {
    const { batchId: id } = await context.params;
    batchId = id;

    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";

    logger.info("Delete batch attempt", { batchId, force });

    await batchManagementFacade.deleteBatch(batchId, force);

    logger.info("Delete batch success", {
      batchId,
      force,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete batch failed (AppError)", {
        batchId,
        message: error.message,
        status: error.statusCode,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Delete batch unexpected error", {
      batchId,
      error: toErrorMessage(error),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
