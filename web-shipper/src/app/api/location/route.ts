import { NextResponse } from "next/server";
import { requireShipper, shipperApiError } from "../../../server/shipper-auth";
import { geocodeAddress, LocationError } from "../../../../../packages/location/index.mjs";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireShipper();
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const items = await geocodeAddress(q);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (!(error instanceof LocationError)) {
      const result = shipperApiError(error);
      return NextResponse.json({error:result.message},{status:result.status});
    }
    return NextResponse.json({error: error instanceof Error ? error.message : "Không thể định vị địa chỉ"}, {
      status: error instanceof LocationError ? error.status : 500, headers: {"Cache-Control": "no-store"}
    });
  }
}
