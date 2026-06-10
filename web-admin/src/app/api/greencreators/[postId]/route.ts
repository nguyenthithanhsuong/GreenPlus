import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { greenCreatorContentFacade } from "../../../../../backend/modules/greencreators/greencreator-content.facade";
import { logger } from "@/lib/logger"; 

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

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export const PATCH = withSentry(
  async (request: Request, context: Context) => {
    const { postId } = await context.params;

    const accessToken = readAccessToken(request);

    if (!accessToken) {
      logger.warn("Update post status failed - unauthorized");

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);

    ensureAdminOrManager(verified.role);

    const body = (await request.json()) as {
      status?: "pending" | "approved" | "rejected";
    };

    logger.info("Update post status attempt", {
      postId,
      status: body.status,
    });

    const start = Date.now();

    const updated = await greenCreatorContentFacade.changeStatus(
      postId,
      body.status ?? "pending",
    );

    logger.info("Update post status success", {
      postId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(updated, { status: 200 });
  },
);

export const DELETE = withSentry(
  async (request: Request, context: Context) => {
    const { postId } = await context.params;

    const accessToken = readAccessToken(request);

    if (!accessToken) {
      logger.warn("Delete post failed - unauthorized");

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);

    ensureAdminOrManager(verified.role);

    const body = (await request.json().catch(
      (): { force?: boolean } => ({}),
    )) as { force?: boolean };

    logger.info("Delete post attempt", {
      postId,
      force: Boolean(body.force),
    });

    const start = Date.now();

    await greenCreatorContentFacade.deletePost(
      postId,
      Boolean(body.force),
    );

    logger.info("Delete post success", {
      postId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(
      { deleted: true },
      { status: 200 },
    );
  },
);