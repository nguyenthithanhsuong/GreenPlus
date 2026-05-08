import { NextResponse } from "next/server";
import { inventoryManagementFacade } from "../../../../../backend/modules/inventory/facades/inventory-management.facade";

export async function GET() {
  try {
    const items =
      await inventoryManagementFacade.listTransactions();

    return NextResponse.json({
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}