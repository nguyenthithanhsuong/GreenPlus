import { NextResponse } from "next/server";
import { AppError } from "../../../../../backend/core/errors";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { greenCreatorContentFacade } from "../../../../../backend/modules/greencreators/greencreator-content.facade";

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
  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);
    ensureAdminOrManager(verified.role);

    const params = await context.params;
    const body = (await request.json()) as { status?: "pending" | "approved" | "rejected" };

    const updated = await greenCreatorContentFacade.changeStatus(params.postId, body.status ?? "pending");

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);
    ensureAdminOrManager(verified.role);

    const params = await context.params;
    const body = (await request.json().catch(() => ({}))) as { force?: boolean };
    await greenCreatorContentFacade.deletePost(params.postId, Boolean(body.force));

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
