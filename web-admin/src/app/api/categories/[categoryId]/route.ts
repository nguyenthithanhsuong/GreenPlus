import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { categoryManagementFacade } from "../../../../../backend/modules/catalog/facades/category-management.facade";
import { logger } from "@/lib/logger";

type Context = {
  params: Promise<{ categoryId: string }>;
};

export const PUT = withSentry(async (request: Request, context: Context) => {
  const { categoryId } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    imageUrl?: string;
  };

  logger.info("Update category attempt", { categoryId, name: body.name });
  const start = Date.now();

  const updated = await categoryManagementFacade.updateCategory({
    categoryId,
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
  });

  logger.info("Update category success", { categoryId, duration_ms: Date.now() - start });
  return NextResponse.json(updated, { status: 200 });
});

export const DELETE = withSentry(async (request: Request, context: Context) => {
  const { categoryId } = await context.params;

  logger.info("Delete category attempt", { categoryId });
  const start = Date.now();

  await categoryManagementFacade.deleteCategory(categoryId);

  logger.info("Delete category success", { categoryId, duration_ms: Date.now() - start });
  return NextResponse.json({ deleted: true }, { status: 200 });
});