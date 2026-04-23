import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { batchManagementFacade } from "../../../../../backend/modules/batches/facades/batch-management.facade";

type Context = {
  params: Promise<{
    batchId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { batchId } = await context.params;
    const body = (await request.json()) as {
      productId?: string;
      supplierId?: string;
      harvestDate?: string;
      expireDate?: string;
      quantity?: number;
      qrCode?: string | null;
      status?: "available" | "expired" | "sold_out";
    };

    const updated = await batchManagementFacade.updateBatch({
      batchId,
      productId: body.productId,
      supplierId: body.supplierId,
      harvestDate: body.harvestDate,
      expireDate: body.expireDate,
      quantity: body.quantity,
      qrCode: body.qrCode,
      status: body.status,
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

export async function PATCH(request: Request, context: Context) {
  try {
    const { batchId } = await context.params;
    const body = (await request.json()) as {
      status?: "available" | "expired" | "sold_out";
    };

    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const updated = await batchManagementFacade.changeStatus(batchId, body.status);
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
    const { batchId } = await context.params;
    await batchManagementFacade.deleteBatch(batchId);
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