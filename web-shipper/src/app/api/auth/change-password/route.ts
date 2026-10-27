import { NextResponse } from "next/server";
import { requireShipper, ShipperError, shipperApiError } from "../../../../server/shipper-auth";
import { shipperDb } from "../../../../server/shipper-db";
import { hashPassword, verifyPassword } from "../../../../lib/shipper-security.mjs";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json({ error: "Nguồn yêu cầu không hợp lệ" }, { status: 403, headers: noStore });
  try {
    const user = await requireShipper();
    const raw: unknown = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new ShipperError("Dữ liệu không hợp lệ", 400, "INVALID_PASSWORD_INPUT");
    const body = raw as Record<string, unknown>;
    if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string" ||
        body.currentPassword.length > 1024 || body.newPassword.length < 8 || body.newPassword.length > 128 ||
        body.currentPassword === body.newPassword)
      throw new ShipperError("Mật khẩu mới cần 8–128 ký tự và phải khác mật khẩu cũ", 400, "INVALID_PASSWORD_INPUT");
    const { data, error } = await shipperDb().from("users")
      .select("password").eq("user_id", user.user_id).single();
    if (error || !data) throw new ShipperError("Không xác minh được tài khoản", 503, "PASSWORD_VERIFY_UNAVAILABLE");
    if (!await verifyPassword(body.currentPassword, data.password))
      throw new ShipperError("Mật khẩu hiện tại không chính xác", 400, "INVALID_CURRENT_PASSWORD");
    const password = await hashPassword(body.newPassword);
    // Compare old hash to avoid silently overwriting another concurrent password update.
    const { data: updated, error: updateError } = await shipperDb().from("users")
      .update({ password }).eq("user_id", user.user_id).eq("password", data.password)
      .select("user_id").maybeSingle();
    if (updateError || !updated) throw new ShipperError("Mật khẩu đã thay đổi ở phiên khác hoặc lưu thất bại", 409, "PASSWORD_UPDATE_CONFLICT");
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json({ error: result.message, code: result.code }, { status: result.status, headers: noStore });
  }
}
