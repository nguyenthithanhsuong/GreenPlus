import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { categoryManagementFacade } from "../../../../backend/modules/catalog/facades/category-management.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async () => {
  logger.info("List categories attempt");

  const start = Date.now();
  const items = await categoryManagementFacade.listCategories();

  logger.info("List categories success", {
    count: items.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json({ items, total: items.length }, { status: 200 });
});

export const POST = withSentry(async (request: Request) => {
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    imageUrl?: string;
  };

  logger.info("Create category attempt", { name: body.name });

  const start = Date.now();
  const created = await categoryManagementFacade.createCategory({
    name: body.name ?? "",
    description: body.description,
    imageUrl: body.imageUrl,
  });

  logger.info("Create category success", {
    categoryId: created.category_id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(created, { status: 201 });
});