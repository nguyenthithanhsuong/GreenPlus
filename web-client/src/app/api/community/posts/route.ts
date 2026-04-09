import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { communityPostFacade } from "../../../../../backend/modules/community-posts/facades/community-post.facade";

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCommunityPostBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const content = body.content ?? "";
    const type = body.type?.trim() ?? "";
    const mediaType = body.mediaType?.trim() ?? body.media_type?.trim() ?? "";

    if (!userId || !content || (!type && !mediaType)) {
      return NextResponse.json({ error: "userId, content and either type or mediaType are required" }, { status: 400 });
    }

    const result = await communityPostFacade.createPost({
      userId,
      title: body.title,
      content,
      type: type || undefined,
      mediaType: mediaType || undefined,
      mediaUrl: body.mediaUrl ?? body.media_url,
      mediaUrls: body.mediaUrls ?? body.media_urls,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") ?? "").trim().toLowerCase();
    const userId = (searchParams.get("userId") ?? searchParams.get("user_id") ?? "").trim();

    if (scope === "all") {
      const result = await communityPostFacade.listAllPosts();
      return NextResponse.json(result, { status: 200 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const result = await communityPostFacade.listPostsByUser(userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateCommunityPostBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const postId = body.postId?.trim() ?? body.post_id?.trim() ?? "";
    const content = body.content ?? "";
    const type = body.type?.trim() ?? "";
    const mediaType = body.mediaType?.trim() ?? body.media_type?.trim() ?? "";

    if (!userId || !postId || !content || (!type && !mediaType)) {
      return NextResponse.json({ error: "userId, postId, content and either type or mediaType are required" }, { status: 400 });
    }

    const result = await communityPostFacade.updatePost({
      userId,
      postId,
      title: body.title,
      content,
      type: type || undefined,
      mediaType: mediaType || undefined,
      mediaUrl: body.mediaUrl ?? body.media_url,
      mediaUrls: body.mediaUrls ?? body.media_urls,
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
    const body = (await request.json()) as DeleteCommunityPostBody;
    const userId = body.userId?.trim() ?? body.user_id?.trim() ?? "";
    const postId = body.postId?.trim() ?? body.post_id?.trim() ?? "";

    if (!userId || !postId) {
      return NextResponse.json({ error: "userId and postId are required" }, { status: 400 });
    }

    await communityPostFacade.deletePost({ userId, postId });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
