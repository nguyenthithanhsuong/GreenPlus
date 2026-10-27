import test from 'node:test';
import assert from 'node:assert/strict';
import { createShipperSession, verifyShipperSession, hashPassword, verifyPassword } from '../src/lib/shipper-security.mjs';

const userId = '9aa10000-1111-4111-8111-222222222222';
const secret = 'test-secret-at-least-32-bytes-long-not-production';

test('shipper signed session is valid within 8 hours and expires afterward', () => {
  const now = Date.UTC(2026, 9, 27, 5, 0, 0);
  const token = createShipperSession(userId, secret, now);
  assert.equal(verifyShipperSession(token, secret, now), userId);
  assert.equal(verifyShipperSession(token, secret, now + 8 * 3600_000), null);
  assert.equal(verifyShipperSession(token, `${secret}-wrong`, now), null);
});

test('tampered / malformed / unknown sessions are rejected', () => {
  const token = createShipperSession(userId, secret);
  const chunks = token.split('.');
  assert.equal(verifyShipperSession(`${chunks[0]}.${chunks[1]}.${chunks[2].slice(1)}a`, secret), null);
  assert.equal(verifyShipperSession('not-a-session', secret), null);
  assert.equal(verifyShipperSession(undefined, secret), null);
  assert.throws(() => createShipperSession(userId, 'weak'), /SECRET/);
});

test('shipper login verifies GreenPlus-compatible PBKDF2 SHA512 hashes', async () => {
  const pass = 'test-password-only';
  const saved = await hashPassword(pass);
  assert.match(saved, /^pbkdf2\$100000\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.equal(await verifyPassword(pass, saved), true);
  assert.equal(await verifyPassword('incorrect', saved), false);
  assert.equal(await verifyPassword(pass, 'pbkdf2$notvalid$bad$bad'), false);
});

test('legacy plaintext passwords are checked and can be upgraded on login', async () => {
  assert.equal(await verifyPassword('old-password', 'old-password'), true);
  assert.equal(await verifyPassword('wrong-password', 'old-password'), false);
});
