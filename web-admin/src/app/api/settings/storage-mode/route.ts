import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { portalActor } from "../../../../../backend/core/manager-scope";
import { dockerGatewayReadiness } from "../../../../../backend/core/docker-gateway.mjs";

export const runtime = "nodejs";
const COOKIE_NAME = "greenplus_admin_storage_view";
type Mode = "supabase" | "docker";

async function authorized(request: Request) {
  const actor = await portalActor(request);
  return actor.role === "admin";
}

export async function GET(request: Request) {
  try {
    if (!(await authorized(request))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const cookieStore = await cookies();
    const mode: Mode = cookieStore.get(COOKIE_NAME)?.value === "docker" ? "docker" : "supabase";
    const state = await dockerGatewayReadiness();
    return NextResponse.json({
      mode, dockerConfigured: state.configured, dockerReady: state.ready,
      dockerLocation: state.mode ?? null, dockerError: state.reason ?? null,
      scope: "admin-sandbox-only",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    if (!(await authorized(request))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    if (!(request.headers.get("content-type") ?? "").startsWith("application/json"))
      return NextResponse.json({ error: "JSON required" }, { status: 415 });
    if (Number(request.headers.get("content-length") || 0) > 1024)
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    const payload: unknown = await request.json();
    const mode = (payload && typeof payload === "object" && "mode" in payload)
      ? (payload as { mode?: unknown }).mode : null;
    if (mode !== "supabase" && mode !== "docker")
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    if (mode === "docker") {
      // No optimistic cookie: a configured but unreachable backend is NOT switchable.
      const state = await dockerGatewayReadiness();
      if (!state.ready) return NextResponse.json({ error: state.reason ?? "Docker backend is not ready" }, { status: 503 });
    }
    const response = NextResponse.json({ mode, scope: "admin-sandbox-only" }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(COOKIE_NAME, mode, {
      httpOnly: true, secure: new URL(request.url).protocol === "https:",
      sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch { return NextResponse.json({ error: "Unauthorized or invalid request" }, { status: 401 }); }
}
