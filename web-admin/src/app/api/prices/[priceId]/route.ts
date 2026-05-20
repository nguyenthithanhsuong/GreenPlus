import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { priceManagementFacade } from "../../../../../backend/modules/prices/facades/price-management.facade";

type Context = {
  params: Promise<{
    priceId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { priceId } = await context.params;
    const force = new URL(request.url).searchParams.get("force") === "true";
    const body = (await request.json()) as {
      batchId?: string | null;
      price?: number;
      date?: string;
      status?: "pending" | "active" | "inactive" | null;
    };

    const updated = await priceManagementFacade.updatePrice({
      priceId,
      batchId: body.batchId,
      price: typeof body.price === "number" ? Number(body.price) : undefined,
      date: typeof body.date === "string" ? body.date : undefined,
      status: typeof body.status === "string" ? body.status : body.status === null ? null : undefined,
      force,
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
    const { priceId } = await context.params;
    const force = new URL(_.url).searchParams.get("force") === "true";
    await priceManagementFacade.deletePrice(priceId, force);
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