import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { productFacade } from "../../../../backend/modules/products/facades/product.facade";
import { ProductSort, SearchCriteria } from "../../../../backend/modules/products/product.types";

const VALID_SORTS: ProductSort[] = ["newest", "price_asc", "price_desc"];

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSort(value: string | null): ProductSort | undefined {
  if (!value) {
    return undefined;
  }

  return VALID_SORTS.includes(value as ProductSort) ? (value as ProductSort) : undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const keyword = searchParams.get("keyword");
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const certification = searchParams.get("certification") ?? undefined;
    const minPrice = parseNumber(searchParams.get("minPrice"));
    const maxPrice = parseNumber(searchParams.get("maxPrice"));
    const page = parseNumber(searchParams.get("page")) ?? 1;
    const limit = parseNumber(searchParams.get("limit")) ?? 20;
    const sort = parseSort(searchParams.get("sort")) ?? "newest";

    const hasSearchIntent =
      keyword !== null ||
      categoryId !== undefined ||
      certification !== undefined ||
      minPrice !== undefined ||
      maxPrice !== undefined;

    if (!hasSearchIntent) {
      const result = await productFacade.browseProducts(page, sort, limit);
      return NextResponse.json(result, { status: 200 });
    }

    const criteria: SearchCriteria = {
      keyword: keyword ?? undefined,
      categoryId,
      certification,
      minPrice,
      maxPrice,
      page,
      limit,
      sort,
    };

    const result = await productFacade.searchProducts(criteria);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
