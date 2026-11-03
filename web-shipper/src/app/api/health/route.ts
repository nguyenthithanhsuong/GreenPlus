import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness only: does not depend on Supabase and does not disclose configuration.
export function GET() {
  return NextResponse.json(
    { status: "ok", service: "web-shipper" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
