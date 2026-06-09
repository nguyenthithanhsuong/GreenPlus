import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { inventoryManagementFacade } from "../../../../backend/modules/inventory/facades/inventory-management.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  logger.info("List inventories attempt");

  try {
    const start = Date.now();
    const items = await inventoryManagementFacade.listInventories();

    logger.info("List inventories success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items, total: items.length }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List inventories failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List inventories unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
