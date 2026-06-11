import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { authFacade } from "../../../../../../backend/modules/customer-auth/facades/auth.facade";
import { logger } from "@/lib/logger";

export const POST = withSentry(async (request: Request) => {
  const formData = await request.formData();

  const userIdRaw = formData.get("userId");
  const fileRaw = formData.get("file");

  const userId =
    typeof userIdRaw === "string" ? userIdRaw.trim() : "";

  logger.info("Upload profile image attempt", { userId });

  if (!userId) {
    logger.error("Upload profile image failed - missing userId", {
      userId,
    });

    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 },
    );
  }

  const file = fileRaw instanceof File ? fileRaw : null;

  if (!file) {
    logger.error("Upload profile image failed - missing file", {
      userId,
    });

    return NextResponse.json(
      { error: "file is required" },
      { status: 400 },
    );
  }

  const start = Date.now();

  const result = await authFacade.uploadProfileImage({
    userId,
    file,
  });

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
});