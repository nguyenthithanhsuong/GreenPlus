import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "auth api placeholder" }, { status: 200 });
}
