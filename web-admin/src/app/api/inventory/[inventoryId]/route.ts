import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { inventoryManagementFacade } from "../../../../../backend/modules/inventory/facades/inventory-management.facade";
import { InventoryTransactionType } from "../../../../../backend/modules/inventory/inventory-management.types";

type Context = {
  params: Promise<{
    inventoryId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { inventoryId } = await context.params;
    const body = (await request.json()) as {
      quantityAvailable?: number;
      quantityReserved?: number;
      note?: string;
      type?: InventoryTransactionType;
    };

    const updated = await inventoryManagementFacade.updateInventory({
      inventoryId,
      quantityAvailable: Number(body.quantityAvailable ?? 0),
      quantityReserved: typeof body.quantityReserved === "number" ? Number(body.quantityReserved) : undefined,
      note: body.note,
      type: body.type,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const { inventoryId } = await context.params;
    await inventoryManagementFacade.deleteInventory(inventoryId);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}