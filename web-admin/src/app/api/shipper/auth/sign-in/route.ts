import { NextResponse } from "next/server";
import { authFacade } from "../../../../../../backend/modules/admin-auth/facades/auth.facade";
import { requireShipper } from "../../../../../../backend/modules/delivery-tracking/shipper-delivery.service";
import { AppError } from "../../../../../../backend/core/errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const data = await request.json().catch(() => null);
    if (
      typeof data?.email !== "string" ||
      typeof data?.password !== "string" ||
      !data.email ||
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
    if (String(result.role_name).toLowerCase() !== "shipper")
      return NextResponse.json(
        { error: "Tài khoản không có quyền Shipper" },
        { status: 403 },
      );
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
    return NextResponse.json(
      {
        error:
          "Thông tin đăng nhập không hợp lệ hoặc tài khoản không hoạt động",
      },
      {
        status: e instanceof AppError && e.statusCode === 503 ? 503 : 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
