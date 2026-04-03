import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { loyaltyFacade } from "../../../../../backend/modules/loyalty/facades/loyalty.facade";

type AwardBody = {
  orderId?: string;
  order_id?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AwardBody;
    const orderId = body.orderId?.trim() ?? body.order_id?.trim() ?? "";

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const result = await loyaltyFacade.award({ orderId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
