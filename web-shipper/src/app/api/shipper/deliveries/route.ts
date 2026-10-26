import { sessionHeader } from "../../../../lib/shipper-session";
import { NextResponse } from "next/server";
import {
  makeDeliveryApi,
  DeliveryApiError,
} from "../../../../lib/delivery-api.mjs";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const api = makeDeliveryApi({
      baseUrl: process.env.GREENPLUS_SHIPPER_API_BASE_URL,
    });
    const items = await api.list(
      (await sessionHeader()) || request.headers.get("authorization"),
    );
    return NextResponse.json(
      { items, total: items.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof DeliveryApiError ? error.status : 500;
    return NextResponse.json(
      {
        error:
          error instanceof DeliveryApiError
            ? error.message
            : "Unexpected error",
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
