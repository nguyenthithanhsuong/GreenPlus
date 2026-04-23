import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { orderTrackingFacade } from "../../../../../backend/modules/orders/facades/order-tracking.facade";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { orderId } = await context.params;
    const detail = await orderTrackingFacade.getOrderDetail(orderId);
    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as {
      status?: string;
      note?: string;
    };

    const updated = await orderTrackingFacade.updateOrderStatus({
      orderId,
      status: body.status ?? "",
      note: body.note,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}