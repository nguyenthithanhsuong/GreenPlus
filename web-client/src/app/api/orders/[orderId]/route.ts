import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { orderFacade } from "../../../../../backend/modules/orders/facades/order.facade";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

type UpdateOrderBody = {
  userId?: string;
  user_id?: string;
  deliveryAddress?: string;
  delivery_address?: string;
  deliveryFee?: number;
  delivery_fee?: number;
  note?: string;
};

export async function GET(request: Request, context: Context) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim() ?? searchParams.get("user_id")?.trim() ?? "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { orderId } = await context.params;
    const detail = await orderFacade.getOrderDetail(userId, orderId);
    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const body = (await request.json()) as UpdateOrderBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const deliveryAddress = body.deliveryAddress?.trim() ?? body.delivery_address?.trim();
    const deliveryFeeRaw = body.deliveryFee ?? body.delivery_fee;
    const note = body.note;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { orderId } = await context.params;
    const result = await orderFacade.updateOrder({
      userId,
      orderId,
      deliveryAddress,
      deliveryFee: typeof deliveryFeeRaw === "undefined" ? undefined : Number(deliveryFeeRaw),
      note,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
