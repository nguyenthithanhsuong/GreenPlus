import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { inventoryManagementFacade } from "../../../../../backend/modules/inventory/facades/inventory-management.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async () => {
  logger.info("List inventory transactions attempt");

  const start = Date.now();

  const items = await inventoryManagementFacade.listTransactions();

  logger.info("List inventory transactions success", {
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