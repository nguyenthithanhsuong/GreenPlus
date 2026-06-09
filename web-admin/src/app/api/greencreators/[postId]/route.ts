import { withSentry } from "@/lib/with-sentry";
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

export async function PATCH(request: Request, context: { params: Promise<{ postId: string }> }) {
  const { postId } = await context.params;

  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) {
      logger.warn("Update post status failed - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);
    ensureAdminOrManager(verified.role);

    const body = (await request.json()) as { status?: "pending" | "approved" | "rejected" };
    
    logger.info("Update post status attempt", { postId, status: body.status});

    const start = Date.now();
    const updated = await greenCreatorContentFacade.changeStatus(postId, body.status ?? "pending");

    logger.info("Update post status success", { postId, duration_ms: Date.now() - start });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Update post status failed", { postId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Update post status unexpected error", { postId, error: toErrorMessage(error) });
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ postId: string }> }) {
  const { postId } = await context.params;

  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) {
      logger.warn("Delete post failed - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);
    ensureAdminOrManager(verified.role);

    const body = (await request.json().catch(() => ({}))) as { force?: boolean };
    
    logger.info("Delete post attempt", { postId, force: !!body.force });

    const start = Date.now();
    await greenCreatorContentFacade.deletePost(postId, Boolean(body.force));

    logger.info("Delete post success", { postId, duration_ms: Date.now() - start });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Delete post failed", { postId, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error("Delete post unexpected error", { postId, error: toErrorMessage(error) });
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
