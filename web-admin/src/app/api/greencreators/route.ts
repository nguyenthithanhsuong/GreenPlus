import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../backend/core/errors";
import { AuthService } from "../../../../backend/modules/auth/auth.service";
import { greenCreatorContentFacade } from "../../../../backend/modules/greencreators/greencreator-content.facade";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

type CreateGreenCreatorPostBody = {
  title?: string;
  content?: string;
  type?: "blog" | "video" | "community";
};

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

export async function GET() {
  logger.info("List GreenCreator posts attempt");

  try {
    const start = Date.now();
    const items = await greenCreatorContentFacade.listPosts();

    logger.info("List GreenCreator posts success", {
      count: items.length,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      {
        items,
        total: items.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("List GreenCreator posts failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("List GreenCreator posts unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) {
      logger.warn("Create GreenCreator post failed - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);
    ensureAdminOrManager(verified.role);

    const body = (await request.json()) as CreateGreenCreatorPostBody;
    
    logger.info("Create GreenCreator post attempt", { 
      userId: verified.id, 
      type: body.type 
    });

    const start = Date.now();
    const created = await greenCreatorContentFacade.createPost({
      userId: verified.id,
      title: body.title,
      content: body.content ?? "",
      type: body.type,
    });

    logger.info("Create GreenCreator post success", {
      postId: created.post_id,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Create GreenCreator post failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Create GreenCreator post unexpected error", { error: toErrorMessage(error) });
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
