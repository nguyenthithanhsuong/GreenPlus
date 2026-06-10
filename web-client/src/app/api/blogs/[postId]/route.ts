import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { blogFacade } from "../../../../../backend/modules/blogs/facades/blog.facade";
import { logger } from "@/lib/logger"; 

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  let postId = "";

  try {
    const params = await context.params;
    postId = params.postId;

    logger.info("Get blog post attempt", { postId });

    const start = Date.now();

    const detail = await blogFacade.getBlog(postId);

    logger.info("Get blog post success", {
      postId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Get blog post failed", {
        postId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Get blog post unexpected error", {
      postId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
