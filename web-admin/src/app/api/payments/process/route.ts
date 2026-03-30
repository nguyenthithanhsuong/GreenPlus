import { NextResponse } from "next/server";
import {
  HandleOrderPaymentInput,
  handleOrderPayment,
} from "../../../../../backend/modules/payments/payment.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<HandleOrderPaymentInput>;
    const { orderId, amount, method } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }

    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!method || !["momo", "vnpay", "cod"].includes(method)) {
      return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
    }

    const result = await handleOrderPayment({
      orderId,
      amount,
      method,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
