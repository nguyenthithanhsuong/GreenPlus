import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fingerprintPattern = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i;

export function GET() {
  const fingerprints = (process.env.GREENPLUS_TWA_SHIPPER_SHA256 ?? "").split(",")
    .map(s => s.trim().toUpperCase()).filter(s => fingerprintPattern.test(s));
  const statement = fingerprints.length ? [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: "com.greenplus.shipper", sha256_cert_fingerprints: fingerprints }
  }] : [];
  return NextResponse.json(statement, {headers:{"Cache-Control":"public, max-age=300, must-revalidate", "Content-Type":"application/json"}});
}
