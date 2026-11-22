import { readBoundedJson } from "../../../../../../packages/ai-core/response.mjs";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/shipper-session";
import {
  signInShipper,
  shipperApiError,
} from "../../../../server/shipper-auth";
import { SESSION_HOURS } from "../../../../lib/shipper-shared-auth.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Prevent browser-based cross-origin login and cookie injection.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Nguồn yêu cầu không hợp lệ" },
      { status: 403 },
    );
  }
  let body: Record<string,unknown> | null;
  try {
    body = await readBoundedJson(request,{maxBytes:8192});
  } catch (error) {
    return NextResponse.json({error: "Dữ liệu đăng nhập không hợp lệ"},
      {status: error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 400});
  }
  if (
    typeof body?.email !== "string" ||
    typeof body?.password !== "string" ||
    body.email.length > 254 ||
    body.password.length > 1024 ||
    !body.email.trim() ||
    !body.password
  ) {
    return NextResponse.json(
      { error: "Email và mật khẩu không hợp lệ" },
      { status: 400 },
    );
  }
  try {
    const { user, token } = await signInShipper(
      body.email.trim(),
      body.password,
    );
    const response = NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_HOURS * 60 * 60,
    });
    return response;
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json(
      { error: result.message, code: result.code },
      {
        status: result.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
