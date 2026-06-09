import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../../backend/core/errors";
import { authFacade } from "../../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "../../../../../../../packages/supabase-shared/src/logger";

export async function POST(request: Request) {
  let userId = "";

  try {
    const formData = await request.formData();

    const userIdRaw = formData.get("userId");
    const fileRaw = formData.get("file");

    userId = typeof userIdRaw === "string" ? userIdRaw.trim() : "";

    logger.info("Upload profile image attempt", { userId });
    const start = Date.now();

    const file = fileRaw instanceof File ? fileRaw : null;

    if (!userId) {
      logger.error("Upload profile image failed - missing userId", { userId });
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!file) {
      logger.error("Upload profile image failed - missing file", { userId });
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const result = await authFacade.uploadProfileImage({ userId, file });

    logger.info("Upload profile image success", {
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      {
        path: result.path,
        publicUrl: result.publicUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Upload profile image failed", {
        userId,
        message: error.message,
        status: error.statusCode,
      });

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    logger.error("Upload profile image unexpected error", {
      userId,
      error: toErrorMessage(error),
    });

    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
