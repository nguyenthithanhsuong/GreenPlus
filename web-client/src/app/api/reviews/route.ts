import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { reviewFacade } from "../../../../backend/modules/reviews/facades/review.facade";
import { logger } from "@/lib/logger";

type ReviewBody = {
  userId?: string;
  user_id?: string;
  productId?: string;
  product_id?: string;
  rating?: number;
  comment?: string;
};

export const GET = withSentry(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const productId = (searchParams.get("productId") ?? "").trim();
  const limit = Number(searchParams.get("limit") ?? "20");

  logger.info("List reviews attempt", { productId, limit });

  if (!productId) {
    logger.error("List reviews failed - missing productId");
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  try {
    const start = Date.now();
    const data = await reviewFacade.listReviews(productId, Number.isFinite(limit) ? limit : 20);
    
    logger.info("List reviews success", { 
      productId, 
      count: data.length, 
      duration_ms: Date.now() - start 
    });

    return NextResponse.json({ total: data.length, items: data }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List reviews failed", { productId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
});

export const POST = withSentry(async (request: Request) => {
  let userId = "";
  let productId = "";

  try {
    const body = (await request.json()) as ReviewBody;
    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    productId = body.productId?.trim() ?? body.product_id?.trim() ?? "";
    const rating = Number(body.rating);
    const comment = body.comment ?? "";

    logger.info("Submit review attempt", { userId, productId });

    if (!userId || !productId || Number.isNaN(rating)) {
      logger.error("Submit review failed - missing required fields", { userId, productId });
      return NextResponse.json({ error: "userId, productId and rating are required" }, { status: 400 });
    }

    const start = Date.now();
    const result = await reviewFacade.submitReview({
      userId,
      productId,
      rating,
      comment,
    });

    logger.info("Submit review success", { 
      userId, 
      productId, 
      duration_ms: Date.now() - start 
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Submit review failed", { userId, productId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
});