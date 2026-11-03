import { NextResponse } from "next/server";
import { portalActor } from "../../../../backend/core/manager-scope";

export const runtime = "nodejs";

async function proxy(request: Request, method: "GET" | "POST") {
  if (process.env.GREENPLUS_TENANCY_DEMO !== "true")
    return NextResponse.json(
      { error: "Docker demo is disabled" },
      { status: 404 },
    );
  try {
    if (method === "POST") {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin)
        return NextResponse.json(
          { error: "Forbidden origin" },
          { status: 403 },
        );
      if (
        !(request.headers.get("content-type") ?? "").startsWith(
          "application/json",
        )
      )
        return NextResponse.json({ error: "JSON required" }, { status: 415 });
    }
    const actor = await portalActor(request);
    if (actor.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const endpoint = process.env.GREENPLUS_DOCKER_GATEWAY_URL;
    const key = process.env.GREENPLUS_DOCKER_GATEWAY_KEY;
    if (!endpoint || !key || key.length < 32)
      return NextResponse.json(
        { error: "Demo gateway is not configured" },
        { status: 503 },
      );
    const base = new URL(endpoint);
    if (
      base.protocol !== "http:" ||
      !["127.0.0.1", "localhost"].includes(base.hostname)
    )
      return NextResponse.json(
        { error: "Only local Docker gateway is supported" },
        { status: 503 },
      );
    const body = method === "POST" ? await request.json() : undefined;
    const response = await fetch(new URL("/stores", base), {
      method,
      headers: {
        "x-demo-gateway-key": key,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const payload: unknown = await response.json();
    return NextResponse.json(payload, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Cannot access Docker demo" },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  return proxy(request, "GET");
}
export async function POST(request: Request) {
  return proxy(request, "POST");
}
