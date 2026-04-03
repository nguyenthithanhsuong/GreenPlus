import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { blogFacade } from "../../../../../backend/modules/blogs/facades/blog.facade";

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { postId } = await context.params;
    const detail = await blogFacade.getBlog(postId);
    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
