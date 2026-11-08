import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { portalActor } from "../../../../backend/core/manager-scope";
import { fetchDockerGateway, DockerGatewayError } from "../../../../backend/core/docker-gateway.mjs";

export const runtime = "nodejs";

async function proxy(request: Request, method: "GET" | "POST") {
  try {
    if (process.env.GREENPLUS_TENANCY_DEMO !== "true")
      return NextResponse.json({ error: "Docker demo is disabled" }, { status: 404 });
    const actor = await portalActor(request);
    if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if ((await cookies()).get("greenplus_admin_storage_view")?.value !== "docker")
      return NextResponse.json({ error: "Select Docker Local in Settings first" }, { status: 409 });
    let body: unknown;
    if (method === "POST") {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin)
        return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
      if (!(request.headers.get("content-type") ?? "").startsWith("application/json"))
        return NextResponse.json({ error: "JSON required" }, { status: 415 });
      if (Number(request.headers.get("content-length") || 0) > 8192)
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
      body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body))
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      const fields = body as Record<string, unknown>;
      if (Object.keys(fields).some((name) => !["name", "tier"].includes(name)) ||
          typeof fields.name !== "string" || fields.name.trim().length < 2 || fields.name.length > 120 ||
          !["regular", "pro", "enterprise"].includes(fields.tier as string))
        return NextResponse.json({ error: "Invalid tenant provisioning request" }, { status: 400 });
    }
    const response = await fetchDockerGateway("/stores", { method, body, timeoutMs: 10000 });
    return NextResponse.json(response.data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof DockerGatewayError ? error.message : "Cannot access Docker demo" }, { status: 503 });
  }
}
export async function GET(request: Request) { return proxy(request, "GET"); }
export async function POST(request: Request) { return proxy(request, "POST"); }
