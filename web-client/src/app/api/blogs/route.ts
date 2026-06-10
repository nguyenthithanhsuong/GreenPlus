import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { blogFacade } from "../../../../backend/modules/blogs/facades/blog.facade";
import { logger } from "@/lib/logger"; 

export const GET = withSentry(async () => {
  logger.info("List blogs attempt");

  const start = Date.now();

  const items = await blogFacade.listBlogs();

  logger.info("List blogs success", {
    duration_ms: Date.now() - start,
    count: items?.length ?? 0,
  });

  return NextResponse.json(
    { items },
    { status: 200 },
  );
});