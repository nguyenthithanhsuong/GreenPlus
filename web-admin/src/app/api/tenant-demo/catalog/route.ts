import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { portalActor } from "../../../../../backend/core/manager-scope";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Kind = "categories" | "catalog-products";

async function proxy(request: Request, method: "GET" | "POST" | "PATCH" | "DELETE") {
  try {
    if (process.env.GREENPLUS_TENANCY_DEMO !== "true") return NextResponse.json({ error: "Docker disabled" }, { status: 404 });
    const actor = await portalActor(request);
    if (actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if ((await cookies()).get("greenplus_admin_storage_view")?.value !== "docker")
      return NextResponse.json({ error: "Select Docker Local in Settings first" }, { status: 409 });
    const input = new URL(request.url);
    const storeId = input.searchParams.get("storeId") || "";
    const kind = input.searchParams.get("kind") as Kind;
    const itemId = input.searchParams.get("itemId");
    if (!uuid.test(storeId) || !["categories", "catalog-products"].includes(kind) || (itemId && !uuid.test(itemId)))
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    if ((method === "POST" && itemId) || (["PATCH", "DELETE"].includes(method) && !itemId))
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    if (method !== "GET") {
      const origin = request.headers.get("origin");
      if (origin && origin !== input.origin) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }
    const endpoint = process.env.GREENPLUS_DOCKER_GATEWAY_URL;
    const key = process.env.GREENPLUS_DOCKER_GATEWAY_KEY;
    if (!endpoint || !key || key.length < 32) return NextResponse.json({ error: "Docker not configured" }, { status: 503 });
    const base = new URL(endpoint);
    if (base.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(base.hostname) || base.username || base.password || base.search || base.hash)
      return NextResponse.json({ error: "Only local Docker gateway is supported" }, { status: 503 });
    let body: unknown;
    if (method === "POST" || method === "PATCH") {
      if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) return NextResponse.json({ error: "JSON required" }, { status: 415 });
      if (Number(request.headers.get("content-length") || 0) > 8192) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
      body = await request.json();
    }
    const path = `/stores/${storeId}/${kind}${itemId ? `/${itemId}` : ""}`;
    const response = await fetch(new URL(path, base), {
      method, headers: { "x-demo-gateway-key": key, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000), cache: "no-store",
    });
    const payload: unknown = await response.json();
    return NextResponse.json(payload, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Docker request failed" }, { status: 503 });
  }
}
export async function GET(request: Request) { return proxy(request, "GET"); }
export async function POST(request: Request) { return proxy(request, "POST"); }
export async function PATCH(request: Request) { return proxy(request, "PATCH"); }
export async function DELETE(request: Request) { return proxy(request, "DELETE"); }
