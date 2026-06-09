import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { authFacade } from "../../../../../backend/modules/admin-auth/facades/auth.facade";
import { logger } from "../../../../../../packages/supabase-shared/src/logger";

function readAccessToken(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice("bearer ".length).trim();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)gp_portal_session=([^;]+)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]).trim() : "";
}

export async function POST(request: Request) {
  const start = Date.now();
  let userId = "";

  try {
    const accessToken = readAccessToken(request);

    logger.info("Change password attempt");

    if (!accessToken) {
      logger.error("Change password failed - unauthorized (missing token)");

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    const authService = new AuthService();
    const verifiedUser = await authService.verifySession(accessToken);

    userId = verifiedUser.id;

    logger.info("Change password verified session", {
      userId,
    });

    const result = await authFacade.changePassword({
      userId,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    logger.info("Change password success", {
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("Change password failed (AppError)", {
        userId,
        message: error.message,
        duration_ms: Date.now() - start,
      });

      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = /invalid|jwt|token|auth|session/i.test(message) ? 401 : 500;

    logger.error("Change password unexpected error", {
      userId,
      error: toErrorMessage(error),
      status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ error: message }, { status });
  }
}