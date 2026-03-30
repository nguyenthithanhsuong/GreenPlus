import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { cartFacade } from "../../../../../backend/modules/cart/facades/cart.facade";

type NoteBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  cartItemId?: string;
  cart_item_id?: string;
  note?: string;
};

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as NoteBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const cartItemId = body.cartItemId?.trim() ?? body.cart_item_id?.trim() ?? "";
    const note = body.note ?? "";

    if (!userId || (!productId && !cartItemId)) {
      return NextResponse.json(
        { error: "userId and either productId or cartItemId are required" },
        { status: 400 }
      );
    }

    const cart = await cartFacade.upsertItemNote(userId, note, {
      productId: productId || undefined,
      cartItemId: cartItemId || undefined,
    });
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
