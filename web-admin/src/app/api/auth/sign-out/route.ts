import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Nguồn yêu cầu không hợp lệ" }, { status: 403 });
  }
  const response = NextResponse.json(
    { signedOut: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  response.cookies.set("gp_admin_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("gp_current_store", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
