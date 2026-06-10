import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { getPermissionsForUser } from "../../../../../backend/core/authorization";
import { logger } from "@/lib/logger"; 

function readAccessToken(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? "";

  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice("bearer ".length).trim();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader.match(
    /(?:^|;\s*)gp_portal_session=([^;]+)/,
  );

  return cookieMatch ? decodeURIComponent(cookieMatch[1]).trim() : "";
}

export const GET = withSentry(async (request: Request) => {
  logger.info("Get user permissions attempt");

  const accessToken = readAccessToken(request);

  if (!accessToken) {
    logger.warn("Get user permissions failed - missing token");

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const authService = new AuthService();
  const verifiedUser = await authService.verifySession(accessToken);

  const start = Date.now();

  const permissions = await getPermissionsForUser(
    verifiedUser.id,
  );

  logger.info("Get user permissions success", {
    userId: verifiedUser.id,
    permissionCount: permissions.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    { permissions },
    { status: 200 },
  );
});