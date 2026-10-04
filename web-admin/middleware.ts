import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/health",
  "/_next",
  "/favicon.ico",
];

function decodeBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
    .buffer as ArrayBuffer;
}

async function hasValidAuthCookie(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("gp_admin_auth")?.value ?? "";
  const [prefix, payload, signature] = token.split(".");
  const secret =
    process.env.AUTH_HANDOFF_SECRET || process.env.AUTH_SESSION_SECRET;

  if (prefix !== "gpv1" || !payload || !signature || !secret) {
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(signature),
      new TextEncoder().encode(payload),
    );

    if (!validSignature) {
      return false;
    }

    const claims = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload)),
    ) as {
      userId?: unknown;
      role?: unknown;
      loginTime?: unknown;
    };
    const loginTimestamp =
      typeof claims.loginTime === "string"
        ? Date.parse(claims.loginTime)
        : Number.NaN;

    return Boolean(
      typeof claims.userId === "string" &&
      ["admin", "manager", "employee"].includes(
        String(claims.role).toLowerCase(),
      ) &&
      Number.isFinite(loginTimestamp) &&
      Date.now() - loginTimestamp <= 7 * 24 * 60 * 60 * 1000,
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (PUBLIC_PATHS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN;

  if (sourceToken && pathname.startsWith("/api/")) {
    const requestInfo = {
      method: request.method,
      path: request.nextUrl.pathname,
      query: request.nextUrl.search,
      timestamp: new Date().toISOString(),
    };

    fetch("https://in.betterstack.com/api/v1/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sourceToken}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level: "INFO",
        message: `API Request: ${request.method} ${request.nextUrl.pathname}`,
        source: "web-admin-middleware",
        context: requestInfo,
      }),
    }).catch((err) => {
      console.error("[BetterStack Middleware] Log send error:", err);
    });
  }

  if (!(await hasValidAuthCookie(request))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
