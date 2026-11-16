import { NextResponse } from "next/server";

export function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Nguồn yêu cầu không hợp lệ" }, { status: 403 });
  }
  const response = NextResponse.json(
    { cleared: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  response.cookies.set("gp_customer_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
