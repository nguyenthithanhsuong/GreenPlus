import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { subscriptionFacade } from "../../../../backend/modules/subscriptions/facades/subscription.facade";

type SubscriptionBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  frequency?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscriptionBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const frequency = body.frequency?.trim() ?? "";

    if (!userId || !productId || !frequency) {
      return NextResponse.json({ error: "userId, productId and frequency are required" }, { status: 400 });
    }

    const result = await subscriptionFacade.subscribe({
      userId,
      productId,
      frequency,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
