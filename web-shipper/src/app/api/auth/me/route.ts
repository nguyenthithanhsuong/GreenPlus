import { resolveDeliveryAddress, LocationError } from "../../../../../../packages/location/index.mjs";
import { NextResponse } from "next/server";
import { requireShipper, shipperApiError, ShipperError } from "../../../../server/shipper-auth";
import { shipperDb } from "../../../../server/shipper-db";
import { normalizeShipperProfile } from "../../../../lib/shipper-profile.mjs";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const user = await requireShipper();
    return NextResponse.json({ user }, { headers: noStore });
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json({ error: result.message, code: result.code }, { status: result.status, headers: noStore });
  }
}

/** Only profile contact data can change; identity, email, status, role and store permissions cannot. */
export async function PATCH(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json({ error: "Nguồn yêu cầu không hợp lệ" }, { status: 403, headers: noStore });
  try {
    const user = await requireShipper();
    const raw: unknown = await request.json().catch(() => null);
    const patch = normalizeShipperProfile(raw);
    if (!patch) throw new ShipperError("Chỉ được cập nhật tên, số điện thoại và địa chỉ hợp lệ", 400, "INVALID_PROFILE");
    let location;
    try {if (patch.address?.trim()) location = await resolveDeliveryAddress(patch.address);}
    catch(error) { throw new ShipperError(error instanceof Error ? error.message : "Địa chỉ không hợp lệ", error instanceof LocationError ? error.status : 422,"ADDRESS_UNVERIFIED"); }
    const { data, error } = await shipperDb().from("users")
      .update({...patch,latitude:location?.latitude??null,longitude:location?.longitude??null})
      .eq("user_id", user.user_id)
      .select("user_id,name,email,phone,address,status")
      .single();
    if (error || !data) throw new ShipperError("Không lưu được hồ sơ Shipper", 503, "PROFILE_UPDATE_FAILED");
    return NextResponse.json({ user: data }, { headers: noStore });
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json({ error: result.message, code: result.code }, { status: result.status, headers: noStore });
  }
}
