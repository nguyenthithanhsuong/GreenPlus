import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fingerprintPattern = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i;

export function GET() {
  const fingerprints = (process.env.GREENPLUS_TWA_CLIENT_SHA256 ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => fingerprintPattern.test(s));
  // An Android package ID configured by Bubblewrap must match the hosted statement.
  const packageName = process.env.GREENPLUS_TWA_CLIENT_PACKAGE_ID ?? "com.greenplus.client";
  const validPackage = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(packageName);
  const statement = fingerprints.length && validPackage
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: packageName,
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ]
    : [];
  return NextResponse.json(statement, {
    headers: {
      "Cache-Control": "public, max-age=300, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
