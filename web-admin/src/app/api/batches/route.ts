import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { batchManagementFacade } from "../../../../backend/modules/batches/facades/batch-management.facade";

export async function GET() {
  try {
    const items = await batchManagementFacade.listBatches();
    return NextResponse.json({ items, total: items.length }, { status: 200 });
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      supplierId?: string;
      harvestDate?: string;
      expireDate?: string;
      quantity?: number;
      qrCode?: string | null;
      status?: "available" | "expired" | "sold_out";
    };

    const created = await batchManagementFacade.createBatch({
      productId: body.productId ?? "",
      supplierId: body.supplierId ?? "",
      harvestDate: body.harvestDate ?? "",
      expireDate: body.expireDate ?? "",
      quantity: typeof body.quantity === "number" ? body.quantity : Number.NaN,
      qrCode: body.qrCode,
      status: body.status,
    });

    return NextResponse.json(created, { status: 201 });
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