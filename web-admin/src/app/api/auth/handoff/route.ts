import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

type HandoffPayload = {
  sub: string;
  email: string;
  role: string;
  target: "admin" | "shipper";
  exp: number;
};

function getHandoffSecret(): string {
  return process.env.AUTH_HANDOFF_SECRET ?? "greenplus-dev-handoff-secret";
}

function verifySignature(payload: string, signature: string): boolean {
  const expected = createHmac("sha256", getHandoffSecret()).update(payload).digest("base64url");

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function parsePayload(payloadEncoded: string): HandoffPayload | null {
  try {
    const decoded = Buffer.from(payloadEncoded, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as HandoffPayload;

    if (!parsed.sub || !parsed.email || !parsed.role || !parsed.target || !parsed.exp) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payloadEncoded = searchParams.get("payload") ?? "";
  const signature = searchParams.get("sig") ?? "";

  if (!payloadEncoded || !signature || !verifySignature(payloadEncoded, signature)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payload = parsePayload(payloadEncoded);
  if (!payload) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (payload.target !== "admin" || payload.exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const portalToken = `${payloadEncoded}.${signature}`;
  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  response.cookies.set("gp_portal_session", portalToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  response.cookies.set("gp_role_name", payload.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
