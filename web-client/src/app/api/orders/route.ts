import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { orderFacade } from "../../../../backend/modules/orders/facades/order.facade";

type CreateOrderBody = {
  userId?: string;
  user_id?: string;
  deliveryAddress?: string;
  delivery_address?: string;
  deliveryFee?: number;
  delivery_fee?: number;
  note?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim() ?? searchParams.get("user_id")?.trim() ?? "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const result = await orderFacade.trackMyOrders(userId);
    return NextResponse.json({ items: result }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const deliveryAddress = body.deliveryAddress?.trim() ?? body.delivery_address?.trim() ?? "";
    const deliveryFee = Number(body.deliveryFee ?? body.delivery_fee ?? 0);
    const note = body.note ?? "";

    if (!userId || !deliveryAddress) {
      return NextResponse.json({ error: "userId and deliveryAddress are required" }, { status: 400 });
    }

    const result = await orderFacade.createOrderFromCart({
      userId,
      deliveryAddress,
      deliveryFee,
      note,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
