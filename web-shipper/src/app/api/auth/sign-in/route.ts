import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  shipperBaseUrl,
} from "../../../../lib/shipper-session";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.email !== "string" || typeof body?.password !== "string")
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 },
      );
    const upstream = await fetch(`${shipperBaseUrl()}/shipper/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });
    if (!upstream.ok)
      return NextResponse.json(
        {
          error: "Thông tin đăng nhập không hợp lệ hoặc không có quyền Shipper",
        },
        { status: upstream.status },
      );
    const payload = await upstream.json();
    if (typeof payload?.session?.access_token !== "string")
      throw new Error("Invalid session");
    const response = NextResponse.json(
      { user: payload.user },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, payload.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Dịch vụ xác thực không khả dụng" },
      { status: 502 },
    );
  }
}
