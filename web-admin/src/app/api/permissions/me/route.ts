import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { getPermissionsForUser } from "../../../../../backend/core/authorization";
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

export async function GET(request: Request) {
  logger.info("Get user permissions attempt");

  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) {
      logger.warn("Get user permissions failed - missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verifiedUser = await authService.verifySession(accessToken);
    
    const start = Date.now();
    const permissions = await getPermissionsForUser(verifiedUser.id);

    logger.info("Get user permissions success", { 
      userId: verifiedUser.id, 
      permissionCount: permissions.length,
      duration_ms: Date.now() - start 
    });

    return NextResponse.json({ permissions }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn("Get user permissions failed", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = toErrorMessage(error);
    const status = /invalid|jwt|token|auth|session/i.test(message) ? 401 : 500;
    
    logger.error("Get user permissions unexpected error", { error: message, status });
    return NextResponse.json({ error: message }, { status });
  }
}
