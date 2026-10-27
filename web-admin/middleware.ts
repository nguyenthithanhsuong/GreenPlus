import { NextResponse, type NextRequest } from "next/server";
import {
  asPortalRole,
  canAccessApi,
  canAccessPage,
  type PortalRole,
} from "./src/lib/portal-access";

const PUBLIC = [
  "/login",
  "/api/auth",
  "/api/shipper/auth",
  "/api/health",
  "/_next",
  "/favicon.ico",
];
const AUTH_TTL_MS = 8 * 60 * 60 * 1000;

function base64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
    .buffer as ArrayBuffer;
}
async function readSession(
  request: NextRequest,
): Promise<{ id: string; role: PortalRole } | null> {
  const token = request.cookies.get("gp_admin_auth")?.value ?? "";
  const [prefix, payload, signature] = token.split(".");
  const secret =
    process.env.AUTH_HANDOFF_SECRET || process.env.AUTH_SESSION_SECRET;
  if (!secret || prefix !== "gpv1" || !payload || !signature) return null;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        key,
        base64Url(signature),
        new TextEncoder().encode(payload),
      ))
    )
      return null;
    const claims = JSON.parse(new TextDecoder().decode(base64Url(payload)));
    const role = asPortalRole(claims.role);
    const issued = Date.parse(claims.loginTime);
    if (
      !role ||
      typeof claims.userId !== "string" ||
      !Number.isFinite(issued) ||
      issued > Date.now() + 60_000 ||
      Date.now() - issued > AUTH_TTL_MS
    )
      return null;
    return { id: claims.userId, role };
  } catch {
    return null;
  }
}
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/register"))
    return NextResponse.redirect(new URL("/login", request.url));
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return NextResponse.next();
  // Dedicated shipper handlers authenticate bearer tokens and enforce order ownership.
  if (pathname.startsWith("/api/shipper/deliveries"))
    return NextResponse.next();
  const session = await readSession(request);
  const isApi = pathname.startsWith("/api/");
  if (!session)
    return isApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
  const allowed = isApi
    ? canAccessApi(session.role, pathname, request.method)
    : canAccessPage(session.role, pathname);
  if (!allowed)
    return isApi
      ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
      : NextResponse.redirect(new URL("/dashboard?access=denied", request.url));
  // User identity is trusted only after the cookie signature and expiry have been checked.
  const forwarded = new Headers(request.headers);
  forwarded.set("x-greenplus-user-id", session.id);
  forwarded.set("x-greenplus-role", session.role);
  return NextResponse.next({ request: { headers: forwarded } });
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
