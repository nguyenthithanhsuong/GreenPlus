import { getApiDocs } from "@/lib/openapi";

export async function GET() {
  if (process.env.ENABLE_API_DOCS !== "true") {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(getApiDocs());
}