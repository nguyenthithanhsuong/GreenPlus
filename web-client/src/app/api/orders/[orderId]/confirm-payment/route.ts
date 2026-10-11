import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { orderFacade } from "../../../../../../backend/modules/orders/facades/order.facade";
import {
  assertCustomerId,
  requireCustomerIdentity,
} from "../../../../../../backend/core/request-auth";
import { logger } from "@/lib/logger";
import { resolveStoreContext } from "../../../../../../backend/core/store-context";

type Context = {
  params: Promise<{
    orderId: string;
  }>;
};

type ConfirmPaymentBody = {
  userId?: string;
  user_id?: string;
  storeId?: string;
};

export const PUT = withSentry(async (request: Request, context: Context) => {
  const identity = requireCustomerIdentity(request);
  const { orderId } = await context.params;

  const body = (await request.json()) as ConfirmPaymentBody;
  const store = await resolveStoreContext(body.storeId, identity);

  const userId = assertCustomerId(body.userId ?? body.user_id, identity.userId);

  logger.info("Confirm payment attempt", { userId, orderId });

  if (!userId) {
    logger.error("Confirm payment failed - missing userId", {
      userId,
      storeId: store.storeId,
      orderId,
    });

    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const start = Date.now();

  const result = await orderFacade.confirmPayment({
    userId,
    storeId: store.storeId,
    orderId,
  });

  logger.info("Confirm payment success", {
    userId,
    orderId,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(result, { status: 200 });
});
