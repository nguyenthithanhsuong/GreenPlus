import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { blogFacade } from "../../../../backend/modules/blogs/facades/blog.facade";

export async function GET() {
  try {
    const items = await blogFacade.listBlogs();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
