import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { userManagementFacade } from "../../../../../backend/modules/users/facades/user-management.facade";
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
  logger.info("Get current user profile attempt");

  const accessToken = readAccessToken(request);

  if (!accessToken) {
    logger.warn("Get current user failed - unauthorized");

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const authService = new AuthService();
  const verifiedUser = await authService.verifySession(accessToken);

  const start = Date.now();

  const user = await userManagementFacade.findCurrentUser({
    userId: verifiedUser.id,
    email: verifiedUser.email,
  });

  if (!user) {
    logger.warn("Get current user failed - profile not found", {
      userId: verifiedUser.id,
    });

    return NextResponse.json(
      { error: "User profile not found" },
      { status: 404 },
    );
  }

  logger.info("Get current user success", {
    userId: verifiedUser.id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    { item: user },
    { status: 200 },
  );
});

export const PATCH = withSentry(async (request: Request) => {
  const accessToken = readAccessToken(request);

  if (!accessToken) {
    logger.warn("Update current user profile failed - unauthorized");

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const authService = new AuthService();
  const verifiedUser = await authService.verifySession(accessToken);

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    imageUrl?: string;
  };

  logger.info("Update current user profile attempt", {
    userId: verifiedUser.id,
  });

  const start = Date.now();

  const updated = await userManagementFacade.updateUser({
    userId: verifiedUser.id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    imageUrl: body.imageUrl,
  });

  logger.info("Update current user profile success", {
    userId: verifiedUser.id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    { item: updated },
    { status: 200 },
  );
});