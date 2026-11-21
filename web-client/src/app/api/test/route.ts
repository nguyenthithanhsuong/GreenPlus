// Development-only smoke endpoint. Do not expose debug endpoints in production.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
