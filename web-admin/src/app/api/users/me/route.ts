import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { AppError } from "../../../../../backend/core/errors";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { userManagementFacade } from "../../../../../backend/modules/users/facades/user-management.facade";

type PortalSessionPayload = {
  sub: string;
  email: string;
  role: string;
  target: "admin" | "shipper";
  exp: number;
};

type CurrentUserContext = {
  userId: string;
  email: string;
};

function readAccessToken(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";
}

function readAccessTokenFromCookie(request: Request): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader) return "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const c of cookies) {
    const [k, ...v] = c.split("=");
    if (k === "gp_access_token") return decodeURIComponent(v.join("="));
  }
  return "";
}

function getHandoffSecret(): string {
  return process.env.AUTH_HANDOFF_SECRET ?? "greenplus-dev-handoff-secret";
}

function verifyPortalSignature(payload: string, signature: string): boolean {
  const expected = createHmac("sha256", getHandoffSecret()).update(payload).digest("base64url");

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function parsePortalCookie(request: Request): PortalSessionPayload | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const rawPortal = cookies.find((cookie) => cookie.startsWith("gp_portal_session="));
  if (!rawPortal) {
    return null;
  }

  const token = decodeURIComponent(rawPortal.slice("gp_portal_session=".length));
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0 || separatorIndex >= token.length - 1) {
    return null;
  }

  const payloadEncoded = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (!verifyPortalSignature(payloadEncoded, signature)) {
    return null;
  }

  try {
    const decoded = Buffer.from(payloadEncoded, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as PortalSessionPayload;
    if (!payload.sub || !payload.email || !payload.exp || payload.target !== "admin") {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function resolveCurrentUser(request: Request): Promise<CurrentUserContext | null> {
  const portalSession = parsePortalCookie(request);
  if (portalSession) {
    return {
      userId: portalSession.sub,
      email: portalSession.email,
    };
  }

  let accessToken = readAccessToken(request);
  if (!accessToken) {
    accessToken = readAccessTokenFromCookie(request);
  }

  if (!accessToken) {
    return null;
  }

  const authService = new AuthService();
  const verifiedUser = await authService.verifySession(accessToken);
  return {
    userId: verifiedUser.id,
    email: verifiedUser.email,
  };
}

export async function GET(request: Request) {
  try {
    const currentUser = await resolveCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await userManagementFacade.findCurrentUser({
      userId: currentUser.userId,
      email: currentUser.email,
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Enforce app-level role restrictions: determine which app made the request
    const host = request.headers.get("host") ?? "";
    const adminOrigin = (process.env.NEXT_PUBLIC_WEB_ADMIN_URL ?? "http://localhost:3001").replace(/^https?:\/\//, "");
    const clientOrigin = (process.env.NEXT_PUBLIC_WEB_CLIENT_URL ?? "http://localhost:3000").replace(/^https?:\/\//, "");
    const shipperOrigin = (process.env.NEXT_PUBLIC_WEB_SHIPPER_URL ?? "http://localhost:3002").replace(/^https?:\/\//, "");

    const roleName = (user.role_name ?? "").toString().trim().toLowerCase();

    let appType: "admin" | "client" | "shipper" | null = null;
    if (host.includes(adminOrigin)) appType = "admin";
    else if (host.includes(shipperOrigin)) appType = "shipper";
    else if (host.includes(clientOrigin)) appType = "client";

    if (appType) {
      const allowed =
        appType === "admin"
          ? roleName === "admin" || roleName === "employee"
          : appType === "shipper"
          ? roleName === "admin" || roleName === "shipper"
          : roleName === "admin" || roleName === "customer";

      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ item: user }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = /invalid|jwt|token|auth|session/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await resolveCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      imageUrl?: string;
    };

    const updated = await userManagementFacade.updateUser({
      userId: currentUser.userId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      imageUrl: body.imageUrl,
    });

    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = /invalid|jwt|token|auth|session/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
