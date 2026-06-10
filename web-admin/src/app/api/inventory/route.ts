import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { inventoryManagementFacade } from "../../../../backend/modules/inventory/facades/inventory-management.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async () => {
  logger.info("List inventories attempt");

  const start = Date.now();

  const items = await inventoryManagementFacade.listInventories();

  logger.info("List inventories success", {
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