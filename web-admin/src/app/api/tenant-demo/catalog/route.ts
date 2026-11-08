import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { portalActor } from "../../../../../backend/core/manager-scope";
import { fetchDockerGateway, DockerGatewayError } from "../../../../../backend/core/docker-gateway.mjs";

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
    let body: unknown;
    if (method !== "GET") {
      const origin = request.headers.get("origin");
      if (origin && origin !== input.origin) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }
    if (method === "POST" || method === "PATCH") {
      if (!(request.headers.get("content-type") ?? "").startsWith("application/json"))
        return NextResponse.json({ error: "JSON required" }, { status: 415 });
      if (Number(request.headers.get("content-length") || 0) > 8192)
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
      body = await request.json();
    }
    const path = `/stores/${storeId}/${kind}${itemId ? `/${itemId}` : ""}`;
    const response = await fetchDockerGateway(path, { method, body });
    return NextResponse.json(response.data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof DockerGatewayError ? error.message : "Docker request failed" }, { status: 503 });
  }
}
export async function GET(request: Request) { return proxy(request, "GET"); }
export async function POST(request: Request) { return proxy(request, "POST"); }
export async function PATCH(request: Request) { return proxy(request, "PATCH"); }
export async function DELETE(request: Request) { return proxy(request, "DELETE"); }
