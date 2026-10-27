import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { productFacade } from "../../../../../backend/modules/products/facades/product.facade";
import { resolveStoreContext } from "../../../../../backend/core/store-context";

type Context = {
  params: Promise<{
    productId: string;
  }>;
};

export const GET = withSentry(async (request: Request, context: Context) => {
  try {
    const { productId } = await context.params;
    const store = await resolveStoreContext(
      new URL(request.url).searchParams.get("storeId"),
    );

    const detail = await productFacade.getProductDetail(
      productId,
      store.storeId,
    );
    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    throw error;
  }
});
