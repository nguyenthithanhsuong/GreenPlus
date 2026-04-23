import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { categoryManagementFacade } from "../../../../../backend/modules/catalog/facades/category-management.facade";

type Context = {
  params: Promise<{
    categoryId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { categoryId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      imageUrl?: string | null;
    };

    const updated = await categoryManagementFacade.updateCategory({
      categoryId,
      name: body.name,
      description: body.description,
      imageUrl: body.imageUrl,
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
    const { categoryId } = await context.params;
    await categoryManagementFacade.deleteCategory(categoryId);
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