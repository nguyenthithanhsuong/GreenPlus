import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { orderFacade } from "../../../../../../backend/modules/orders/facades/order.facade";
import { logger } from "@/lib/logger";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

type ConfirmPaymentBody = {
  userId?: string;
  user_id?: string;
};

export const PUT = withSentry(async (request: Request, context: Context) => {
  const { orderId } = await context.params;

  const body = (await request.json()) as ConfirmPaymentBody;

  const userId =
    body.userId?.trim() ?? body.user_id?.trim() ?? "";

  logger.info("Confirm payment attempt", { userId, orderId });

  if (!userId) {
    logger.error("Confirm payment failed - missing userId", {
      userId,
      orderId,
    });

    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 },
    );
  }

  const start = Date.now();

  const result = await orderFacade.confirmPayment({
    userId,
    orderId,
  });

  logger.info("Confirm payment success", {
    userId,
    orderId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(result, { status: 200 });
});