import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { cartFacade } from "../../../../../backend/modules/cart/facades/cart.facade";
import { logger } from "@/lib/logger"; 

type NoteBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  cartItemId?: string;
  cart_item_id?: string;
  note?: string;
};

export const PUT = withSentry(async (request: Request) => {
  const body = (await request.json()) as NoteBody;

  const userId =
    body.userId?.trim() ?? body.user_id?.trim() ?? "";

  const productId =
    body.productId?.trim() ?? body.product_id?.trim() ?? "";

  const cartItemId =
    body.cartItemId?.trim() ?? body.cart_item_id?.trim() ?? "";

  const note = body.note ?? "";

  logger.info("Upsert cart item note attempt", {
    userId,
    productId,
    cartItemId,
  });

  if (!userId || (!productId && !cartItemId)) {
    logger.error(
      "Upsert cart item note failed - missing identifiers",
      {
        userId,
        productId,
        cartItemId,
      },
    );

    return NextResponse.json(
      {
        error:
          "userId and either productId or cartItemId are required",
      },
      { status: 400 },
    );
  }

  const start = Date.now();

  const cart = await cartFacade.upsertItemNote(
    userId,
    note,
    {
      productId: productId || undefined,
      cartItemId: cartItemId || undefined,
    },
  );

  logger.info("Upsert cart item note success", {
    userId,
    productId,
    cartItemId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(cart, { status: 200 });
});