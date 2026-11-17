import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

// Same gpv1 wire format and signing key as GreenPlus Admin. Shipper keeps its
// own HttpOnly cookie to avoid overwriting Admin login on localhost ports.
const PREFIX = "gpv1";
export const SESSION_HOURS = 8;
const TTL_MS = SESSION_HOURS * 3600_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sharedAuthSecret(env = process.env) {
  const secret = env.AUTH_HANDOFF_SECRET || env.AUTH_SESSION_SECRET;
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("GreenPlus shared auth secret is not configured or is shorter than 32 bytes");
  }
  return secret;
}

export function createSharedShipperToken(user, secret, now = Date.now()) {
  if (!user || !UUID.test(user.user_id) || typeof user.email !== "string") {
    throw new Error("Invalid Shipper identity");
  }
  const payload = Buffer.from(JSON.stringify({
    userId: user.user_id,
    email: user.email,
    role: "shipper",
    sessionId: randomUUID(),
    loginTime: new Date(now).toISOString(),
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${PREFIX}.${payload}.${signature}`;
}

export function verifySharedShipperToken(token, secret, now = Date.now()) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX ||
      !/^[A-Za-z0-9_-]+$/.test(parts[1]) || !/^[A-Za-z0-9_-]+$/.test(parts[2])) return null;
  const expected = createHmac("sha256", secret).update(parts[1]).digest("base64url");
  const providedBytes = Buffer.from(parts[2]);
  const expectedBytes = Buffer.from(expected);
  if (providedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(providedBytes, expectedBytes)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const loginTime = typeof claims.loginTime === "string" ? Date.parse(claims.loginTime) : NaN;
    if (!claims || claims.role !== "shipper" || !UUID.test(claims.userId) ||
        typeof claims.email !== "string" || !UUID.test(claims.sessionId) ||
        !Number.isFinite(loginTime) || loginTime > now + 60_000 ||
        now - loginTime >= TTL_MS) return null;
    return claims.userId;
  } catch { return null; }
}
