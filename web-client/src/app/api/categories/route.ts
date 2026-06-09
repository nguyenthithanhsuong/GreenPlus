import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { categoryFacade } from "../../../../backend/modules/categories/facades/category.facade";
import { CategorySort } from "../../../../backend/modules/categories/category.types";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

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

export async function GET(request: Request) {
  let sort: CategorySort = "name_asc";

  try {
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
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Browse categories failed", {
        sort,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Browse categories unexpected error", {
      sort,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
