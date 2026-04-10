import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { communityPostInteractionFacade } from "../../../../../../backend/modules/community-posts/facades/community-post-interaction.facade";

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
  try {
    const { searchParams } = new URL(request.url);
    const postId = (searchParams.get("postId") ?? searchParams.get("post_id") ?? "").trim();

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const result = await communityPostInteractionFacade.listByPostId(postId);
    return NextResponse.json({ items: result }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateInteractionBody;
    const postId = body.postId?.trim() ?? body.post_id?.trim() ?? "";
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const type = (body.type ?? "").trim().toLowerCase();

    if (!postId || !userId || (type !== "like" && type !== "comment" && type !== "bookmark")) {
      return NextResponse.json({ error: "postId, userId and type are required" }, { status: 400 });
    }

    const result = await communityPostInteractionFacade.addInteraction({
      postId,
      userId,
      type: type as "like" | "comment" | "bookmark",
      comment: body.comment,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UpdateInteractionBody;
    const interactionId = body.interactionId?.trim() ?? body.interaction_id?.trim() ?? "";
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";

    if (!interactionId || !userId || !body.comment?.trim()) {
      return NextResponse.json({ error: "interactionId, userId and comment are required" }, { status: 400 });
    }

    const result = await communityPostInteractionFacade.editComment({
      interactionId,
      userId,
      comment: body.comment,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteInteractionBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const interactionId = body.interactionId?.trim() ?? body.interaction_id?.trim() ?? "";
    const postId = body.postId?.trim() ?? body.post_id?.trim() ?? "";
    const type = body.type?.trim().toLowerCase();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (type === "like" || type === "bookmark") {
      if (!postId) {
        return NextResponse.json({ error: "postId is required" }, { status: 400 });
      }

      const result = await communityPostInteractionFacade.deleteInteraction({
        userId,
        postId,
        type: type as "like" | "bookmark",
      });

      return NextResponse.json(result, { status: 200 });
    }

    if (!interactionId) {
      return NextResponse.json({ error: "interactionId is required" }, { status: 400 });
    }

    const result = await communityPostInteractionFacade.deleteInteraction({
      userId,
      interactionId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}