import { timingSafeEqual, pbkdf2, randomBytes, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(pbkdf2);

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

