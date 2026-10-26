import { sessionHeader } from "../../../../../../lib/shipper-session";
import { NextResponse } from "next/server";
import {
  makeDeliveryApi,
  DeliveryApiError,
} from "../../../../../../lib/delivery-api.mjs";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await context.params;
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.currentStatus !== "string" ||
      typeof body.status !== "string"
    )
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    const api = makeDeliveryApi({
      baseUrl: process.env.GREENPLUS_SHIPPER_API_BASE_URL,
    });
    const item = await api.update(
      (await sessionHeader()) || request.headers.get("authorization"),
      orderId,
      body.currentStatus,
      body.status,
    );
    return NextResponse.json(item, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof DeliveryApiError ? error.status : 500;
    return NextResponse.json(
      {
        error:
          error instanceof DeliveryApiError
            ? error.message
            : "Unexpected error",
      },
      { status },
    );
  }
}
