import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { orderFacade } from "../../../../../../backend/modules/orders/facades/order.facade";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

type CancelBody = {
  userId?: string;
  user_id?: string;
  note?: string;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as CancelBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const result = await orderFacade.cancelOrder({
      userId,
      orderId,
      note: body.note ?? "",
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
