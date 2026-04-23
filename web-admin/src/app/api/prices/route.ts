import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { priceManagementFacade } from "../../../../backend/modules/prices/facades/price-management.facade";

export async function GET() {
  try {
    const items = await priceManagementFacade.listPrices();
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
      batchId?: string | null;
      price?: number;
      date?: string;
    };

    const created = await priceManagementFacade.createPrice({
      batchId: body.batchId,
      price: Number(body.price),
      date: String(body.date ?? ""),
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