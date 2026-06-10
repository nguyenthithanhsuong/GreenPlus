import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

type PortalPayload = {
  sub: string;
  email: string;
  role: string;
  target: "admin" | "shipper";
  exp: number;
};

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const entry of cookieHeader.split(";")) {
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!name) {
      continue;
    }

    result[name] = value;
  }

  return result;
}

function parsePortalPayload(portalSession: string): PortalPayload | null {
  const [payloadEncoded, signature] = portalSession.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }

  const expected = createHmac(
    "sha256",
    process.env.AUTH_HANDOFF_SECRET ?? "greenplus-dev-handoff-secret"
  )
    .update(payloadEncoded)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const json = Buffer.from(payloadEncoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as PortalPayload;

    if (!parsed.sub || !parsed.email || !parsed.role || !parsed.exp) {
      return null;
    }

    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function buildDisplayNameFromEmail(email: string): string {
  const prefix = email.split("@")[0]?.trim() ?? "";
  if (!prefix) {
    return "Portal User";
  }

  return prefix
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const GET = withSentry(async (request: Request) => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = parseCookieHeader(cookieHeader);
  const roleCookie = cookies.gp_role_name;

  logger.info("Get session attempt");

  if (!roleCookie) {
    logger.warn("Get session failed - missing role cookie");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleName = decodeURIComponent(roleCookie).trim().toLowerCase();
  if (!roleName) {
    logger.warn("Get session failed - invalid role name");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portalSession = cookies.gp_portal_session;
  const portalPayload = portalSession ? parsePortalPayload(portalSession) : null;

  if (portalPayload) {
    logger.info("Get session success - portal user", { userId: portalPayload.sub });
    return NextResponse.json(
      {
        item: {
          role_name: roleName,
          user_id: portalPayload.sub,
          email: portalPayload.email,
          name: buildDisplayNameFromEmail(portalPayload.email),
          phone: null,
          address: null,
          image_url: null,
          status: "active",
        },
      },
      { status: 200 }
    );
  }

  if (roleName === "admin") {
    logger.info("Get session success - admin fallback");
    return NextResponse.json(
      {
        item: {
          role_name: roleName,
          user_id: "admin-portal",
          email: "admin@greenplus.local",
          name: "Admin",
          phone: null,
          address: null,
          image_url: null,
          status: "active",
        },
      },
      { status: 200 }
    );
  }

  logger.info("Get session success - minimal response", { roleName });
  return NextResponse.json({ item: { role_name: roleName } }, { status: 200 });
});