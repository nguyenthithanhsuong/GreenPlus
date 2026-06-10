import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { categoryFacade } from "../../../../backend/modules/categories/facades/category.facade";
import { CategorySort } from "../../../../backend/modules/categories/category.types";
import { logger } from "@/lib/logger"; 

const ALLOWED_SORT: CategorySort[] = ["name_asc", "name_desc", "newest"];

function parseSort(value: string | null): CategorySort {
  if (!value) {
    return "name_asc";
  }

  if (ALLOWED_SORT.includes(value as CategorySort)) {
    return value as CategorySort;
  }

  return "name_asc";
}

export const GET = withSentry(async (request: Request) => {
  let sort: CategorySort = "name_asc";

  const { searchParams } = new URL(request.url);
  sort = parseSort(searchParams.get("sort"));

  logger.info("Browse categories attempt", { sort });

  const start = Date.now();

  const result = await categoryFacade.browseCategories(sort);

  logger.info("Browse categories success", {
    sort,
    duration_ms: Date.now() - start,
    count: result?.items?.length ?? 0,
  });

  return NextResponse.json(result, { status: 200 });
});