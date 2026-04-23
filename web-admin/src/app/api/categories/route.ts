import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { categoryManagementFacade } from "../../../../backend/modules/catalog/facades/category-management.facade";

export async function GET() {
  try {
    const items = await categoryManagementFacade.listCategories();
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
      name?: string;
      description?: string;
      imageUrl?: string;
    };

    const created = await categoryManagementFacade.createCategory({
      name: body.name ?? "",
      description: body.description,
      imageUrl: body.imageUrl,
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
