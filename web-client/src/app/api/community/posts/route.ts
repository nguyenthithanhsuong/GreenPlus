import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { communityPostFacade } from "../../../../../backend/modules/community-posts/facades/community-post.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

type CreateCommunityPostBody = {
  userId?: string;
  user_id?: string;
  title?: string;
  content?: string;
  type?: string;
  mediaType?: string;
  media_type?: string;
  mediaUrl?: string;
  media_url?: string;
  mediaUrls?: string[];
  media_urls?: string[];
};

type UpdateCommunityPostBody = {
  userId?: string;
  user_id?: string;
  postId?: string;
  post_id?: string;
  title?: string;
  content?: string;
  type?: string;
  mediaType?: string;
  media_type?: string;
  mediaUrl?: string;
  media_url?: string;
  mediaUrls?: string[];
  media_urls?: string[];
};

type DeleteCommunityPostBody = {
  userId?: string;
  user_id?: string;
  postId?: string;
  post_id?: string;
};

/* =========================
   CREATE POST
========================= */
export async function POST(request: Request) {
  let userId = "";

  try {
    const body = (await request.json()) as CreateCommunityPostBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const content = body.content ?? "";
    const type = body.type?.trim() ?? "";
    const mediaType = body.mediaType?.trim() ?? body.media_type?.trim() ?? "";

    logger.info("Create community post attempt", {
      userId,
      type,
      mediaType,
    });

    if (!userId || !content || (!type && !mediaType)) {
      logger.error("Create community post failed - invalid input", {
        userId,
        type,
        mediaType,
      });

      return NextResponse.json(
        {
          error:
            "userId, content and either type or mediaType are required",
        },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await communityPostFacade.createPost({
      userId,
      title: body.title,
      content,
      type:
        (type || undefined) as
          | "blog"
          | "video"
          | "community"
          | undefined,
      mediaType: mediaType || undefined,
      mediaUrl: body.mediaUrl ?? body.media_url,
      mediaUrls: body.mediaUrls ?? body.media_urls,
    });

    logger.info("Create community post success", {
      userId,
      type,
      mediaType,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create community post failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Create community post unexpected error", {
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

/* =========================
   GET POSTS
========================= */
export async function GET(request: Request) {
  let userId = "";

  try {
    const { searchParams } = new URL(request.url);

    const scope = (searchParams.get("scope") ?? "")
      .trim()
      .toLowerCase();

    userId =
      (searchParams.get("userId") ??
        searchParams.get("user_id") ??
        "").trim();

    logger.info("List community posts attempt", {
      scope,
      userId,
    });

    const start = Date.now();

    if (scope === "all") {
      const result = await communityPostFacade.listAllPosts();

      logger.info("List all community posts success", {
        duration_ms: Date.now() - start,
      });

      return NextResponse.json(result, { status: 200 });
    }

    if (!userId) {
      logger.error("List community posts failed - missing userId", {
        scope,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const result =
      await communityPostFacade.listPostsByUser(userId);

    logger.info("List user community posts success", {
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List community posts failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("List community posts unexpected error", {
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE POST
========================= */
export async function PUT(request: Request) {
  let userId = "";
  let postId = "";

  try {
    const body = (await request.json()) as UpdateCommunityPostBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    postId = body.postId?.trim() ?? body.post_id?.trim() ?? "";

    const content = body.content ?? "";
    const type = body.type?.trim() ?? "";
    const mediaType = body.mediaType?.trim() ?? body.media_type?.trim() ?? "";

    logger.info("Update community post attempt", {
      userId,
      postId,
      type,
      mediaType,
    });

    if (!userId || !postId || !content || (!type && !mediaType)) {
      logger.error("Update community post failed - invalid input", {
        userId,
        postId,
      });

      return NextResponse.json(
        {
          error:
            "userId, postId, content and either type or mediaType are required",
        },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await communityPostFacade.updatePost({
      userId,
      postId,
      title: body.title,
      content,
      type:
        (type || undefined) as
          | "blog"
          | "video"
          | "community"
          | undefined,
      mediaType: mediaType || undefined,
      mediaUrl: body.mediaUrl ?? body.media_url,
      mediaUrls: body.mediaUrls ?? body.media_urls,
    });

    logger.info("Update community post success", {
      userId,
      postId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update community post failed", {
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

    logger.error("Update community post unexpected error", {
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

/* =========================
   DELETE POST
========================= */
export async function DELETE(request: Request) {
  let userId = "";
  let postId = "";

  try {
    const body = (await request.json()) as DeleteCommunityPostBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    postId = body.postId?.trim() ?? body.post_id?.trim() ?? "";

    logger.info("Delete community post attempt", {
      userId,
      postId,
    });

    if (!userId || !postId) {
      logger.error("Delete community post failed - missing identifiers", {
        userId,
        postId,
      });

      return NextResponse.json(
        { error: "userId and postId are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    await communityPostFacade.deletePost({ userId, postId });

    logger.info("Delete community post success", {
      userId,
      postId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete community post failed", {
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

    logger.error("Delete community post unexpected error", {
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
