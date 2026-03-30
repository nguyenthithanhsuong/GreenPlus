import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "products api placeholder" }, { status: 200 });
}
