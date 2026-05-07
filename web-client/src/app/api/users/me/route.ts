import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean);

  const roleCookie = cookies.find((cookie) => cookie.startsWith("gp_role_name="));
  if (!roleCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleName = decodeURIComponent(roleCookie.slice("gp_role_name=".length)).trim().toLowerCase();
  if (!roleName) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ item: { role_name: roleName } }, { status: 200 });
}
