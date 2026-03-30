import { NextResponse } from "next/server";
import { OrderService } from "../../../../backend/modules/orders/order.service";
import { OrderRepository } from "../../../../backend/modules/orders/order.repository";

export async function GET() {
  return NextResponse.json(
    {
      message: "orders api is ready",
      methods: ["POST"],
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
    };

    const userId = body.userId?.trim() ?? "";
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const service = new OrderService(new OrderRepository());
    const order = await service.create(userId);

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
