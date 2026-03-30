import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { orderFacade } from "../../../../../backend/modules/orders/facades/order.facade";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
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
