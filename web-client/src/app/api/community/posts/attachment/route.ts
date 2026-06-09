import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { communityPostFacade } from "../../../../../../backend/modules/community-posts/facades/community-post.facade";
import { logger } from "../../../../../../../packages/supabase-shared/src/logger";

export async function POST(request: Request) {
  let userId = "";
  let postId = "";

  try {
    const formData = await request.formData();

    const userIdRaw = formData.get("userId");
    const postIdRaw = formData.get("postId");

    const filesFromList = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    const singleFile = formData.get("file");

    const files = filesFromList.length
      ? filesFromList
      : singleFile instanceof File
        ? [singleFile]
        : [];

    userId = typeof userIdRaw === "string" ? userIdRaw.trim() : "";
    postId = typeof postIdRaw === "string" ? postIdRaw.trim() : "";

    logger.info("Upload community post attachments attempt", {
      userId,
      postId,
      fileCount: files.length,
    });

    if (!userId || !postId) {
      logger.error("Upload community post attachments failed - missing identifiers", {
        userId,
        postId,
      });

      return NextResponse.json(
        { error: "userId and postId are required" },
        { status: 400 }
      );
    }

    if (!files.length) {
      logger.error("Upload community post attachments failed - missing files", {
        userId,
        postId,
      });

      return NextResponse.json(
        { error: "files are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await communityPostFacade.uploadAttachment({
      userId,
      postId,
      files,
      replaceExisting: true,
    });

    logger.info("Upload community post attachments success", {
      userId,
      postId,
      fileCount: files.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      {
        items: result.items,
        mediaUrls: result.mediaUrls,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Upload community post attachments failed", {
        userId,
        postId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Upload community post attachments unexpected error", {
      userId,
      postId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
