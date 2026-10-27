import { NextResponse } from "next/server";
import { AppError } from "../../../../backend/core/errors";
import { portalActor } from "../../../../backend/core/manager-scope";
import { geocodeAddress, LocationError } from "../../../../../packages/location/index.mjs";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await portalActor(request);
    if (!actor) return NextResponse.json({error:"Unauthorized"},{status:401});
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const items = await geocodeAddress(q);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Không thể định vị địa chỉ"}, {
      status: error instanceof LocationError ? error.status : error instanceof AppError ? error.statusCode : 500, headers: {"Cache-Control": "no-store"}
    });
  }
}
