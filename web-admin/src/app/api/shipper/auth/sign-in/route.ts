import { NextResponse } from "next/server";
import { authFacade } from "../../../../../../backend/modules/admin-auth/facades/auth.facade";
import {
  requireShipper,
  ShipperDeliveryError,
} from "../../../../../../backend/modules/delivery-tracking/shipper-delivery.service";
import { AppError } from "../../../../../../backend/core/errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const data = await request.json().catch(() => null);
    if (
      typeof data?.email !== "string" ||
      typeof data?.password !== "string" ||
      !data.email.trim() ||
      !data.password
    )
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 },
      );
    const result = await authFacade.signIn({
      email: data.email,
      password: data.password,
    });
    // Verify the current database role, not only the role_name claim embedded in the session.
    await requireShipper(
      new Request(request.url, {
        headers: { Authorization: `Bearer ${result.session.access_token}` },
      }),
    );
    return NextResponse.json(
      {
        session: { access_token: result.session.access_token },
        user: result.user,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const status =
      e instanceof ShipperDeliveryError
        ? e.status
        : e instanceof AppError && e.statusCode === 503
          ? 503
          : 401;
    const message =
      status === 403
        ? "Tài khoản không có quyền Shipper hoặc đã bị khóa"
        : status === 503
          ? "Không thể xác minh tài khoản, thử lại sau"
          : "Email hoặc mật khẩu không hợp lệ";
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
