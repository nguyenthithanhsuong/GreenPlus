import { NextResponse } from "next/server";
import { AuthController } from "../../../../backend/modules/auth/auth.controller";
import { AuthService } from "../../../../backend/modules/auth/auth.service";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

function readAccessToken(request: Request, fallbackToken?: string): string {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";
  return (fallbackToken ?? bearerToken).trim();
}

export async function GET() {
  logger.info("Auth API health check");

  return NextResponse.json(
    {
      message: "auth api is ready",
      methods: ["POST"],
      requirement: "Provide Bearer access token or accessToken in body",
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  const start = Date.now();
  let userId = "";

  try {
    const body = (await request.json()) as {
      accessToken?: string;
    };

    const accessToken = readAccessToken(request, body.accessToken);

    logger.info("Auth session verification attempt");

    if (!accessToken) {
      logger.error("Auth session verification failed - missing accessToken");

      return NextResponse.json(
        { error: "accessToken is required" },
        { status: 400 }
      );
    }

    const controller = new AuthController(new AuthService());
    const result = await controller.verifySession(accessToken);

    userId = result?.id ?? "";

    logger.info("Auth session verification success", {
      userId,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = /invalid|jwt|token|auth|session/i.test(message) ? 401 : 500;

    logger.error("Auth session verification failed", {
      userId,
      error: message,
      status,
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({ error: message }, { status });
  }
}