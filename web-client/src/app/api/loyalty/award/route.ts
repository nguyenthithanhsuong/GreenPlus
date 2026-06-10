import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { loyaltyFacade } from "../../../../../backend/modules/loyalty/facades/loyalty.facade";

type AwardBody = {
  orderId?: string;
  order_id?: string;
};

export const POST = withSentry(async (request: Request) => {
  const body = (await request.json()) as AwardBody;

  const orderId = body.orderId?.trim() ?? body.order_id?.trim() ?? "";

  if (!orderId) {
    return NextResponse.json(
      { error: "orderId is required" },
      { status: 400 },
    );
  }

  const result = await loyaltyFacade.award({ orderId });

  return NextResponse.json(result, { status: 200 });
});