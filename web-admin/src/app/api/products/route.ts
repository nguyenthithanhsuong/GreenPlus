import { NextResponse } from "next/server";
import { ProductService } from "../../../../backend/modules/catalog/product.service";
import { AppError } from "../../../../backend/core/errors";

export async function GET() {
  try {
    const service = new ProductService();
    const items = await service.listProducts();

    return NextResponse.json(
      {
        items,
        total: items.length,
      },
      { status: 200 }
    );
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
      categoryId?: string | null;
      name?: string;
      description?: string;
      unit?: string;
      imageUrl?: string;
      nutrition?: string;
      status?: "active" | "inactive";
    };

    const service = new ProductService();
    const created = await service.createProduct({
      categoryId: body.categoryId,
      name: body.name ?? "",
      description: body.description,
      unit: body.unit ?? "",
      imageUrl: body.imageUrl,
      nutrition: body.nutrition,
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
