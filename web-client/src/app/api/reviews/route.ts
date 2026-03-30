import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { reviewFacade } from "../../../../backend/modules/reviews/facades/review.facade";

type ReviewBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  rating?: number;
  comment?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const rating = Number(body.rating);
    const comment = body.comment ?? "";

    if (!userId || !productId || Number.isNaN(rating)) {
      return NextResponse.json({ error: "userId, productId and rating are required" }, { status: 400 });
    }

    const result = await reviewFacade.submitReview({
      userId,
      productId,
      rating,
      comment,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
