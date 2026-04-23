import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { authFacade } from "../../../../../../backend/modules/customer-auth/facades/auth.facade";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const userIdRaw = formData.get("userId");
    const fileRaw = formData.get("file");

    const userId = typeof userIdRaw === "string" ? userIdRaw.trim() : "";
    const file = fileRaw instanceof File ? fileRaw : null;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const result = await authFacade.uploadProfileImage({ userId, file });

    return NextResponse.json(
      {
        path: result.path,
        publicUrl: result.publicUrl,
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
