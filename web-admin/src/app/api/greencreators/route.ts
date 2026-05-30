import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { greenCreatorContentFacade } from "../../../../backend/modules/community/greencreator-content.facade";

export async function GET() {
  try {
    const items = await greenCreatorContentFacade.listPosts();

    return NextResponse.json(
      {
        items,
        total: items.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
