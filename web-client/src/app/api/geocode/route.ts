import { NextResponse } from "next/server";
import { geocodeAddress, LocationError } from "../../../../../packages/location/index.mjs";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const items = await geocodeAddress(new URL(request.url).searchParams.get("q"));
    return NextResponse.json({items: items.map(item => ({...item,label:item.address}))}, {headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error ? error.message : "Không tìm thấy địa chỉ"}, {status:error instanceof LocationError ? error.status : 503});
  }
}
