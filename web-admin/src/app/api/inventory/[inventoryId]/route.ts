import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { inventoryManagementFacade } from "../../../../../backend/modules/inventory/facades/inventory-management.facade";
import { InventoryTransactionType } from "../../../../../backend/modules/inventory/inventory-management.types";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type Context = {
  params: Promise<{
    inventoryId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  const { inventoryId } = await context.params;

  try {
    const body = (await request.json()) as {
      quantityAvailable?: number;
      quantityReserved?: number;
      note?: string;
      type?: InventoryTransactionType;
    };

    logger.info("Update inventory attempt", { inventoryId, type: body.type });

    const start = Date.now();
    const updated = await inventoryManagementFacade.updateInventory({
      inventoryId,
      quantityAvailable: Number(body.quantityAvailable ?? 0),
      quantityReserved: typeof body.quantityReserved === "number" ? Number(body.quantityReserved) : null,
      note: body.note,
      type: body.type,
    });

    logger.info("Update inventory success", {
      inventoryId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update inventory failed", { inventoryId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update inventory unexpected error", { inventoryId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: Context) {
  const { inventoryId } = await context.params;
  
  logger.info("Delete inventory attempt", { inventoryId });

  try {
    const start = Date.now();
    await inventoryManagementFacade.deleteInventory(inventoryId);
    
    logger.info("Delete inventory success", {
      inventoryId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete inventory failed", { inventoryId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Delete inventory unexpected error", { inventoryId, error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
