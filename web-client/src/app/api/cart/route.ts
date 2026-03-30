import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { cartFacade } from "../../../../backend/modules/cart/facades/cart.facade";

type CartMutationBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  quantity?: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim() ?? searchParams.get("user_id")?.trim() ?? "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const cart = await cartFacade.getCart(userId);
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CartMutationBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const quantity = Number(body.quantity);

    if (!userId || !productId || Number.isNaN(quantity)) {
      return NextResponse.json({ error: "userId, productId and quantity are required" }, { status: 400 });
    }

    const cart = await cartFacade.addItem(userId, productId, quantity);
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CartMutationBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const quantity = Number(body.quantity);

    if (!userId || !productId || Number.isNaN(quantity)) {
      return NextResponse.json({ error: "userId, productId and quantity are required" }, { status: 400 });
    }

    const cart = await cartFacade.updateItemQuantity(userId, productId, quantity);
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as CartMutationBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";

    if (!userId || !productId) {
      return NextResponse.json({ error: "userId and productId are required" }, { status: 400 });
    }

    const cart = await cartFacade.removeItem(userId, productId);
    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
