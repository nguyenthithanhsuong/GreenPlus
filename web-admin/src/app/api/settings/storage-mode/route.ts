import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { portalActor } from "../../../../../backend/core/manager-scope";

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
    const store = await cookies();
    const mode: Mode = store.get(COOKIE_NAME)?.value === "docker" ? "docker" : "supabase";
    return NextResponse.json({ mode, dockerConfigured: Boolean(process.env.GREENPLUS_TENANCY_DEMO === "true" && process.env.GREENPLUS_DOCKER_GATEWAY_URL && process.env.GREENPLUS_DOCKER_GATEWAY_KEY), scope: "admin-sandbox-only" }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    if (!(await authorized(request))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415 });
    const payload: unknown = await request.json();
    const mode = (payload && typeof payload === "object" && "mode" in payload) ? (payload as { mode?: unknown }).mode : null;
    if (mode !== "supabase" && mode !== "docker") return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    if (mode === "docker" && !(process.env.GREENPLUS_TENANCY_DEMO === "true" && process.env.GREENPLUS_DOCKER_GATEWAY_URL && process.env.GREENPLUS_DOCKER_GATEWAY_KEY)) return NextResponse.json({ error: "Docker sandbox is not configured" }, { status: 503 });
    const response = NextResponse.json({ mode, scope: "admin-sandbox-only" }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(COOKIE_NAME, mode, { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch { return NextResponse.json({ error: "Unauthorized or invalid request" }, { status: 401 }); }
}
