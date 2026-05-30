import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { complaintFacade } from "../../../../backend/modules/complaints/facades/complaint.facade";
import { ComplaintType } from "../../../../backend/modules/complaints/complaint.types";

type ComplaintBody = {
  userId?: string;
  user_id?: string;
  orderId?: string;
  order_id?: string;
  type?: ComplaintType;
  description?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ComplaintBody;

    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const orderId = body.orderId?.trim() ?? body.order_id?.trim() ?? "";
    const type = body.type;
    const description = body.description?.trim() ?? "";

    if (!userId || !orderId || !type || !description) {
      return NextResponse.json(
        { error: "userId, orderId, type and description are required" },
        { status: 400 }
      );
    }

    const result = await complaintFacade.submitComplaint({
      userId,
      orderId,
      type,
      description,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
