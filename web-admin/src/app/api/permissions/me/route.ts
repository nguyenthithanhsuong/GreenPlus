import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { getPermissionsForUser } from "../../../../../backend/core/authorization";

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
  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const authService = new AuthService();
    const verifiedUser = await authService.verifySession(accessToken);
    const permissions = await getPermissionsForUser(verifiedUser.id);

    return NextResponse.json({ permissions }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = /invalid|jwt|token|auth|session/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
