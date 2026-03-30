import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { categoryFacade } from "../../../../backend/modules/categories/facades/category.facade";
import { CategorySort } from "../../../../backend/modules/categories/category.types";

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
  try {
    const { searchParams } = new URL(request.url);
    const sort = parseSort(searchParams.get("sort"));

    const result = await categoryFacade.browseCategories(sort);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
