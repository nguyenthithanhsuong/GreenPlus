import { createHmac, randomUUID, timingSafeEqual, pbkdf2, randomBytes, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(pbkdf2);
export const SESSION_HOURS = 8;
const PREFIX = 'gps1';

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  if (stored.startsWith('pbkdf2$')) {
    const parts = stored.split('$');
    if (parts.length !== 4) return false;
    const [, roundsText, salt, hex] = parts;
    const rounds = Number(roundsText);
    if (!Number.isSafeInteger(rounds) || rounds < 10000 || rounds > 1000000 ||
        !/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(hex)) return false;
    const derived = await derive(password, salt, rounds, 64, 'sha512');
    return sameBytes(derived, Buffer.from(hex, 'hex'));
  }
  // Backwards compatibility with GreenPlus legacy passwords. Upgrade on next successful login.
  const hash = value => createHash('sha256').update(value, 'utf8').digest();
  return sameBytes(hash(password), hash(stored));
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hashed = await derive(password, salt, 100000, 64, 'sha512');
  return `pbkdf2$100000$${salt}$${hashed.toString('hex')}`;
}

function sessionSecret(secret) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    throw new Error('SHIPPER_SESSION_SECRET must contain at least 32 bytes');
  }
  return secret;
}

export function createShipperSession(userId, secret, now = Date.now()) {
  if (typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) throw new Error('Invalid user id');
  const payload = Buffer.from(JSON.stringify({ sub: userId, iat: now, exp: now + SESSION_HOURS * 3600000, sid: randomUUID() })).toString('base64url');
  const signed = `${PREFIX}.${payload}`;
  const signature = createHmac('sha256', sessionSecret(secret)).update(signed).digest('base64url');
  return `${signed}.${signature}`;
}

export function verifyShipperSession(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX || !/^[A-Za-z0-9_-]+$/.test(parts[1]) || !/^[A-Za-z0-9_-]+$/.test(parts[2])) return null;
  const signed = `${parts[0]}.${parts[1]}`;
  const expected = createHmac('sha256', sessionSecret(secret)).update(signed).digest('base64url');
  if (!sameBytes(Buffer.from(parts[2]), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!data || typeof data.sub !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.sub) ||
        !Number.isSafeInteger(data.iat) || !Number.isSafeInteger(data.exp) ||
        data.iat > now + 60000 || data.iat < now - SESSION_HOURS * 3600000 ||
        data.exp <= now || data.exp - data.iat !== SESSION_HOURS * 3600000) return null;
    return data.sub;
  } catch { return null; }
}
