import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean);

  const hasAccessToken = cookies.some((cookie) => cookie.startsWith("gp_access_token="));
  const hasPortalSession = cookies.some((cookie) => cookie.startsWith("gp_portal_session="));

  return NextResponse.json({ hasAccessToken, hasPortalSession }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.access_token === "string" ? body.access_token : "";

    if (!token) {
      return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    // set cookie for this origin so subsequent same-origin requests include it
    // cookie name: gp_access_token
    res.cookies.set("gp_access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const clearPortalSession = searchParams.get("portal") === "1";
  const res = NextResponse.json({ ok: true });
  res.cookies.set("gp_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  if (clearPortalSession) {
    res.cookies.set("gp_portal_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}
