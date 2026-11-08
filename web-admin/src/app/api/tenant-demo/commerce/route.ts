import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { portalActor } from "../../../../../backend/core/manager-scope";
import { fetchDockerGateway, DockerGatewayError } from "../../../../../backend/core/docker-gateway.mjs";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Read-only commerce inspection; mutations are restricted to the separate sandbox actions.
export async function GET(request: Request) {
  try {
    if (process.env.GREENPLUS_TENANCY_DEMO !== "true") return NextResponse.json({error:"Docker disabled"},{status:404});
    const actor = await portalActor(request);
    if (actor.role !== "admin") return NextResponse.json({error:"Forbidden"},{status:403});
    if ((await cookies()).get("greenplus_admin_storage_view")?.value !== "docker")
      return NextResponse.json({error:"Select Docker Local first"},{status:409});
    const input = new URL(request.url);
    const storeId = input.searchParams.get("storeId") ?? "";
    const kind = input.searchParams.get("kind") ?? "";
    const orderId = input.searchParams.get("orderId");
    if (!uuid.test(storeId) || !["inventory", "orders"].includes(kind) || (orderId && (!uuid.test(orderId) || kind !== "orders")))
      return NextResponse.json({error:"Invalid request"},{status:400});
    const path = `/stores/${storeId}/${kind}${orderId ? `/${orderId}` : ""}`;
    const response = await fetchDockerGateway(path);
    return NextResponse.json(response.data,{status:response.status,headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    return NextResponse.json({error:error instanceof DockerGatewayError ? error.message : "Docker request failed"},{status:503});
  }
}

// Sandbox-only actions. Production Supabase checkout and real payment processors are untouched.
export async function POST(request: Request) {
  try {
    if (process.env.GREENPLUS_TENANCY_DEMO !== "true") return NextResponse.json({error:"Docker disabled"},{status:404});
    const actor = await portalActor(request);
    if (actor.role !== "admin") return NextResponse.json({error:"Forbidden"},{status:403});
    if ((await cookies()).get("greenplus_admin_storage_view")?.value !== "docker")
      return NextResponse.json({error:"Select Docker Local first"},{status:409});
    const origin = request.headers.get("origin");
    if (origin !== new URL(request.url).origin) return NextResponse.json({error:"Invalid origin"},{status:403});
    if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) return NextResponse.json({error:"JSON required"},{status:415});
    if (Number(request.headers.get("content-length") || 0) > 8192) return NextResponse.json({error:"Payload too large"},{status:413});
    const input: unknown = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({error:"Invalid payload"},{status:400});
    const value = input as Record<string,unknown>;
    const storeId = value.storeId;
    const orderId = value.orderId;
    const action = value.action;
    if (typeof storeId !== "string" || !uuid.test(storeId)) return NextResponse.json({error:"Invalid store"},{status:400});
    if (typeof action !== "string" || !["restock","checkout","cancel","simulate-payment","assign-delivery","complete-delivery"].includes(action))
      return NextResponse.json({error:"Invalid operation"},{status:400});
    if (["cancel","simulate-payment","assign-delivery","complete-delivery"].includes(action) && (typeof orderId !== "string" || !uuid.test(orderId)))
      return NextResponse.json({error:"Invalid order"},{status:400});
    if (action === "checkout" && (typeof orderId !== "string" || !uuid.test(orderId))) return NextResponse.json({error:"Invalid order"},{status:400});
    let path: string;
    let body: Record<string, unknown>;
    if (action === "restock") {
      if (typeof value.productId !== "string" || !uuid.test(value.productId) || !Number.isInteger(value.quantity) ||
          (value.quantity as number) < 1 || (value.quantity as number) > 100000 || Object.keys(value).length !== 4)
        return NextResponse.json({error:"Invalid restock"},{status:400});
      path = `/stores/${storeId}/restock`; body = {product_id:value.productId,quantity:value.quantity};
    } else if (action === "checkout") {
      if (!Array.isArray(value.items) || value.items.length === 0 || value.items.length > 50 || Object.keys(value).length !== 4 ||
          value.items.some(item => !item || typeof item !== "object" || Array.isArray(item) || typeof item.product_id !== "string" || !uuid.test(item.product_id) ||
          !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000 || Object.keys(item).length !== 2))
        return NextResponse.json({error:"Invalid checkout"},{status:400});
      path = `/stores/${storeId}/checkout`;body={order_id:orderId,items:value.items};
    } else if (action === "assign-delivery") {
      if (typeof value.assignedTo !== "string" || !value.assignedTo.trim() || value.assignedTo.length > 120 || Object.keys(value).length !== 4)
        return NextResponse.json({error:"Invalid assignee"},{status:400});
      path = `/stores/${storeId}/orders/${orderId}/assign-delivery`;body={assigned_to:value.assignedTo.trim()};
    } else {
      if (Object.keys(value).length !== 3) return NextResponse.json({error:"Invalid fields"},{status:400});
      path = `/stores/${storeId}/orders/${orderId}/${action}`;body={};
    }
    const response = await fetchDockerGateway(path, { method: "POST", body, timeoutMs: 15000 });
    return NextResponse.json(response.data,{status:response.status,headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    return NextResponse.json({error:error instanceof DockerGatewayError ? error.message : "Docker request failed"},{status:503});
  }
}
