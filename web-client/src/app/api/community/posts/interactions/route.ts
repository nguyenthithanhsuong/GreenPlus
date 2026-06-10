import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { communityPostInteractionFacade } from "../../../../../../backend/modules/community-posts/facades/community-post-interaction.facade";
import { logger } from "@/lib/logger"; 

type CreateInteractionBody = {
  postId?: string;
  post_id?: string;
  userId?: string;
  user_id?: string;
  type?: string;
  comment?: string;
};

type UpdateInteractionBody = {
  interactionId?: string;
  interaction_id?: string;
  userId?: string;
  user_id?: string;
  comment?: string;
};

type DeleteInteractionBody = {
  interactionId?: string;
  interaction_id?: string;
  postId?: string;
  post_id?: string;
  userId?: string;
  user_id?: string;
  type?: string;
};

export async function GET(request: Request) {
  let postId = "";

  try {
    const { searchParams } = new URL(request.url);
    postId = (searchParams.get("postId") ?? searchParams.get("post_id") ?? "").trim();

    logger.info("List post interactions attempt", { postId });

    if (!postId) {
      logger.error("List post interactions failed - missing postId", { postId });

      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await communityPostInteractionFacade.listByPostId(postId);

    logger.info("List post interactions success", {
      postId,
      count: Array.isArray(result) ? result.length : 0,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ items: result }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List post interactions failed", {
        postId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("List post interactions unexpected error", {
      postId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let postId = "";
  let userId = "";
  let type = "";

  try {
    const body = (await request.json()) as CreateInteractionBody;

    postId = body.postId?.trim() ?? body.post_id?.trim() ?? "";
    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    type = (body.type ?? "").trim().toLowerCase();

    logger.info("Create interaction attempt", { postId, userId, type });

    if (!postId || !userId || (type !== "like" && type !== "comment" && type !== "bookmark")) {
      logger.error("Create interaction failed - invalid input", {
        postId,
        userId,
        type,
      });

      return NextResponse.json(
        { error: "postId, userId and type are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await communityPostInteractionFacade.addInteraction({
      postId,
      userId,
      type: type as "like" | "comment" | "bookmark",
      comment: body.comment,
    });

    logger.info("Create interaction success", {
      postId,
      userId,
      type,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create interaction failed", {
        postId,
        userId,
        type,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Create interaction unexpected error", {
      postId,
      userId,
      type,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  let interactionId = "";
  let userId = "";

  try {
    const body = (await request.json()) as UpdateInteractionBody;

    interactionId =
      body.interactionId?.trim() ?? body.interaction_id?.trim() ?? "";
    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";

    logger.info("Edit interaction comment attempt", {
      interactionId,
      userId,
    });

    if (!interactionId || !userId || !body.comment?.trim()) {
      logger.error("Edit interaction failed - invalid input", {
        interactionId,
        userId,
      });

      return NextResponse.json(
        { error: "interactionId, userId and comment are required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const result = await communityPostInteractionFacade.editComment({
      interactionId,
      userId,
      comment: body.comment,
    });

    logger.info("Edit interaction success", {
      interactionId,
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Edit interaction failed", {
        interactionId,
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Edit interaction unexpected error", {
      interactionId,
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  let userId = "";
  let interactionId = "";
  let postId = "";
  let type = "";

  try {
    const body = (await request.json()) as DeleteInteractionBody;

    userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    interactionId =
      body.interactionId?.trim() ?? body.interaction_id?.trim() ?? "";
    postId = body.postId?.trim() ?? body.post_id?.trim() ?? "";
    type = body.type?.trim().toLowerCase() ?? "";

    logger.info("Delete interaction attempt", {
      userId,
      interactionId,
      postId,
      type,
    });

    if (!userId) {
      logger.error("Delete interaction failed - missing userId", {
        userId,
      });

      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    let result;

    if (type === "like" || type === "bookmark") {
      if (!postId) {
        logger.error("Delete interaction failed - missing postId", {
          userId,
          type,
        });

        return NextResponse.json(
          { error: "postId is required" },
          { status: 400 }
        );
      }

      const start = Date.now();

      result = await communityPostInteractionFacade.deleteInteraction({
        userId,
        postId,
        type: type as "like" | "bookmark",
      });

      logger.info("Delete interaction success (by type)", {
        userId,
        postId,
        type,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json(result, { status: 200 });
    }

    if (!interactionId) {
      logger.error("Delete interaction failed - missing interactionId", {
        userId,
      });

      return NextResponse.json(
        { error: "interactionId is required" },
        { status: 400 }
      );
    }

    const start = Date.now();

    result = await communityPostInteractionFacade.deleteInteraction({
      userId,
      interactionId,
    });

    logger.info("Delete interaction success (by id)", {
      userId,
      interactionId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete interaction failed", {
        userId,
        interactionId,
        postId,
        type,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error("Delete interaction unexpected error", {
      userId,
      interactionId,
      postId,
      type,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
