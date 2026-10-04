import { createHmac, timingSafeEqual } from "crypto";
import { AppError } from "./errors";

type CustomerTokenPayload = {
  userId: string;
  email: string;
  sessionId: string;
  loginTime: string;
  exp: number;
};

function getSessionSecret(): string {
  const secret =
    process.env.AUTH_HANDOFF_SECRET || process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new AppError("Session secret is not configured", 500);
  }

  return secret;
}

function readCookie(request: Request, name: string): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]).trim() : "";
}

function readAccessToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return readCookie(request, "gp_customer_auth");
}

export function requireCustomerIdentity(
  request: Request,
): CustomerTokenPayload {
  const token = readAccessToken(request);
  const [prefix, payloadEncoded, signature] = token.split(".");

  if (prefix !== "gpc1" || !payloadEncoded || !signature) {
    throw new AppError("Unauthorized", 401);
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(payloadEncoded)
    .digest("base64url");
  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadEncoded, "base64url").toString("utf8"),
    ) as Partial<CustomerTokenPayload>;

    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.sessionId !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      throw new Error("Invalid token payload");
    }

    return parsed as CustomerTokenPayload;
  } catch {
    throw new AppError("Unauthorized", 401);
  }
}

export function assertCustomerId(
  requestedUserId: string | undefined,
  actualUserId: string,
): string {
  const normalizedRequestedId = requestedUserId?.trim() ?? "";

  if (normalizedRequestedId && normalizedRequestedId !== actualUserId) {
    throw new AppError("Forbidden", 403);
  }

  return actualUserId;
}
