import { NextResponse } from "next/server";
import { sessionHeader, shipperBaseUrl } from "../../../../lib/shipper-session";
export const runtime = "nodejs";
export async function GET() {
  const auth = await sessionHeader();
  if (!auth)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  try {
    const upstream = await fetch(`${shipperBaseUrl()}/shipper/auth/me`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (!upstream.ok)
      return NextResponse.json(
        { error: "Phiên đăng nhập hết hạn" },
        { status: upstream.status },
      );
    return NextResponse.json(await upstream.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối máy chủ" },
      { status: 502 },
    );
  }
}
