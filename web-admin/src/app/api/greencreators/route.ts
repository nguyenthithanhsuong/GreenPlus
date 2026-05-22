import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { AuthService } from "../../../../backend/modules/auth/auth.service";
import { greenCreatorContentFacade } from "../../../../backend/modules/community/greencreator-content.facade";

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
  try {
    const items = await greenCreatorContentFacade.listPosts();

    return NextResponse.json(
      {
        items,
        total: items.length,
      },
      { status: 200 }
    );
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

export async function POST(request: Request) {
  try {
    const accessToken = readAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const verified = await authService.verifySession(accessToken);
    ensureAdminOrManager(verified.role);

    const body = (await request.json()) as CreateGreenCreatorPostBody;
    const created = await greenCreatorContentFacade.createPost({
      userId: verified.id,
      title: body.title,
      content: body.content ?? "",
      type: body.type,
    });

    return NextResponse.json(created, { status: 201 });
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
