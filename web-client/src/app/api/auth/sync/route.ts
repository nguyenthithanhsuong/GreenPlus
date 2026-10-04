import { NextResponse } from "next/server";

export function DELETE() {
  const response = NextResponse.json({ cleared: true }, { status: 200 });

  response.cookies.set("gp_customer_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
