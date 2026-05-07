import { createHmac } from "crypto";
import { NextResponse } from "next/server";

type HandoffTarget = "admin" | "shipper";

function getHandoffSecret(): string {
  return process.env.AUTH_HANDOFF_SECRET ?? "greenplus-dev-handoff-secret";
}

function getTargetBaseUrl(target: HandoffTarget): string {
  if (target === "shipper") {
    return process.env.NEXT_PUBLIC_WEB_SHIPPER_URL ?? "http://localhost:3002";
  }
  return process.env.NEXT_PUBLIC_WEB_ADMIN_URL ?? "http://localhost:3001";
}

function isAllowedTargetForRole(target: HandoffTarget, roleName: string): boolean {
  if (target === "shipper") {
    return roleName === "shipper";
  }

  return roleName !== "customer";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      email?: string;
      roleName?: string;
      targetApp?: HandoffTarget;
    };

    const userId = (body.userId ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const roleName = (body.roleName ?? "").trim().toLowerCase();
    const targetApp = body.targetApp ?? "admin";

    if (!userId || !email || !roleName) {
      return NextResponse.json({ error: "Missing handoff fields" }, { status: 400 });
    }

    if (targetApp !== "admin" && targetApp !== "shipper") {
      return NextResponse.json({ error: "Invalid handoff target" }, { status: 400 });
    }

    if (!isAllowedTargetForRole(targetApp, roleName)) {
      return NextResponse.json({ error: "Role is not allowed for target app" }, { status: 403 });
    }

    const payload = {
      sub: userId,
      email,
      role: roleName,
      target: targetApp,
      exp: Math.floor(Date.now() / 1000) + 60,
    };

    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", getHandoffSecret())
      .update(payloadEncoded)
      .digest("base64url");

    const redirectUrl = `${getTargetBaseUrl(targetApp)}/api/auth/handoff?payload=${encodeURIComponent(
      payloadEncoded
    )}&sig=${encodeURIComponent(signature)}`;

    return NextResponse.json({ redirectUrl }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unable to generate handoff" }, { status: 500 });
  }
}
