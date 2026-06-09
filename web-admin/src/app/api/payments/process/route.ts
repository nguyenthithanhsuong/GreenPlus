import { NextResponse } from "next/server";
import {
  HandleOrderPaymentInput,
  handleOrderPayment,
} from "../../../../../backend/modules/payments/payment.service";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";
import { toErrorMessage } from "../../../../../backend/core/errors";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<HandleOrderPaymentInput>;
    const { orderId, amount, method } = body;

    logger.info("Handle order payment attempt", { orderId, amount, method });

    if (!orderId || typeof orderId !== "string") {
      logger.error("Handle order payment failed - invalid orderId");
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }

    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      logger.error("Handle order payment failed - invalid amount", { orderId });
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!method || !["momo", "vnpay", "cod"].includes(method)) {
      logger.error("Handle order payment failed - unsupported method", { orderId, method });
      return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
    }

    const start = Date.now();
    const result = await handleOrderPayment({
      orderId,
      amount,
      method,
    });

    logger.info("Handle order payment success", {
      orderId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error("Handle order payment unexpected error", { error: toErrorMessage(error) });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}