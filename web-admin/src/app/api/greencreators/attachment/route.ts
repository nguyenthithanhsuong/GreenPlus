import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { greenCreatorContentFacade } from "../../../../../backend/modules/greencreators/greencreator-content.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

function readAccessToken(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";

  if (bearerToken) {
    return bearerToken;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)gp_portal_session=([^;]+)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]).trim() : "";
}

function ensureAdminOrManager(role: string): void {
  const normalized = (role ?? "").toLowerCase();
  if (normalized.includes("admin") || normalized.includes("manager")) {
    return;
  }

  throw new AppError("Forbidden", 403);
}

export async function POST(request: Request) {
  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) {
      logger.warn("Upload attachment failed - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);
    ensureAdminOrManager(verified.role);

    const formData = await request.formData();

    const postIdRaw = formData.get("postId");
    const postId = typeof postIdRaw === "string" ? postIdRaw.trim() : "";
    const filesFromList = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);
    const singleFile = formData.get("file");
    const files = filesFromList.length
      ? filesFromList
      : singleFile instanceof File
        ? [singleFile]
        : [];

    logger.info("Upload attachment attempt", { 
      postId, 
      fileCount: files.length, 
      userId: verified.id 
    });

    if (!postId) {
      logger.error("Upload attachment failed - missing postId");
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    if (!files.length) {
      logger.error("Upload attachment failed - missing files", { postId });
      return NextResponse.json({ error: "files are required" }, { status: 400 });
    }

    const start = Date.now();
    const result = await greenCreatorContentFacade.uploadAttachment({
      userId: verified.id,
      postId,
      files,
      replaceExisting: true,
    });

    logger.info("Upload attachment success", { 
      postId, 
      duration_ms: Date.now() - start 
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
      logger.error("Upload attachment failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Upload attachment unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}