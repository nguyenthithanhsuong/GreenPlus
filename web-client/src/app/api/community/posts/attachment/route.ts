import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { communityPostFacade } from "../../../../../../backend/modules/community-posts/facades/community-post.facade";

export async function POST(request: Request) {
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

    const userId = typeof userIdRaw === "string" ? userIdRaw.trim() : "";
    const postId = typeof postIdRaw === "string" ? postIdRaw.trim() : "";

    if (!userId || !postId) {
      return NextResponse.json({ error: "userId and postId are required" }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ error: "files are required" }, { status: 400 });
    }

    const result = await communityPostFacade.uploadAttachment({
      userId,
      postId,
      files,
      replaceExisting: true,
    });

    return NextResponse.json(
      {
        items: result.items,
        mediaUrls: result.mediaUrls,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
