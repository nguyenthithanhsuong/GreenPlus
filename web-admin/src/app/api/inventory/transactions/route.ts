import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { inventoryManagementFacade } from "../../../../../backend/modules/inventory/facades/inventory-management.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";
import { toErrorMessage } from "../../../../../backend/core/errors";

export async function GET() {
  logger.info("List inventory transactions attempt");

  try {
    const start = Date.now();
    const items = await inventoryManagementFacade.listTransactions();

    logger.info("List inventory transactions success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({
      items,
      total: items.length,
    }, { status: 200 });
  } catch (error) {
    logger.error("List inventory transactions unexpected error", { 
      error: toErrorMessage(error) 
    });

    return NextResponse.json(
      {
        error: toErrorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}
