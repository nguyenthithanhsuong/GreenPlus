import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { productFacade } from "../../../../../backend/modules/products/facades/product.facade";

type Context = {
  params: Promise<{
    productId: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { productId } = await context.params;

    const detail = await productFacade.getProductDetail(productId);
    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
