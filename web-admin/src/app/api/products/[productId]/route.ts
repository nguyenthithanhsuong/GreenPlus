import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { productManagementFacade } from "../../../../../backend/modules/catalog/facades/product-management.facade";

type Context = {
  params: Promise<{
    productId: string;
  }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { productId } = await context.params;
    const body = (await request.json()) as {
      categoryId?: string | null;
      name?: string;
      description?: string | null;
      unit?: string;
      imageUrl?: string | null;
      nutrition?: string | null;
      status?: "active" | "inactive";
    };

    const updated = await productManagementFacade.updateProduct({
      productId,
      categoryId: body.categoryId,
      name: body.name,
      description: body.description,
      unit: body.unit,
      imageUrl: body.imageUrl,
      nutrition: body.nutrition,
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
    const { productId } = await context.params;
    const body = (await request.json()) as {
      action?: "activate" | "deactivate";
      status?: "active" | "inactive";
    };

    if (body.action === "activate") {
      const updated = await productManagementFacade.changeStatus(productId, "active");
      return NextResponse.json(updated, { status: 200 });
    }

    if (body.action === "deactivate") {
      const updated = await productManagementFacade.changeStatus(productId, "inactive");
      return NextResponse.json(updated, { status: 200 });
    }

    if (typeof body.status !== "undefined") {
      const updated = await productManagementFacade.changeStatus(productId, body.status);
      return NextResponse.json(updated, { status: 200 });
    }

    return NextResponse.json({ error: "action or status is required" }, { status: 400 });
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
    const { productId } = await context.params;
    await productManagementFacade.deleteProduct(productId);
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
