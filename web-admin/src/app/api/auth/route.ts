import { NextResponse } from "next/server";
import { AuthController } from "../../../../backend/modules/auth/auth.controller";
import { AuthService } from "../../../../backend/modules/auth/auth.service";

function readAccessToken(request: Request, fallbackToken?: string): string {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";
  return (fallbackToken ?? bearerToken).trim();
}

export async function GET() {
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
  try {
    const body = (await request.json()) as {
      accessToken?: string;
    };

    const accessToken = readAccessToken(request, body.accessToken);

    if (!accessToken) {
      return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
    }

    const controller = new AuthController(new AuthService());
    const result = await controller.verifySession(accessToken);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = /invalid|jwt|token|auth|session/i.test(message) ? 401 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
