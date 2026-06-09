import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { blogFacade } from "../../../../backend/modules/blogs/facades/blog.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export async function GET() {
  try {
    logger.info("List blogs attempt");

    const start = Date.now();

    const items = await blogFacade.listBlogs();

    logger.info("List blogs success", {
      duration_ms: Date.now() - start,
      count: items?.length ?? 0,
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List blogs failed", {
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("List blogs unexpected error", {
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}