import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { hashPassword, verifyPassword } from '../src/lib/shipper-security.mjs';
import { createSharedShipperToken, verifySharedShipperToken, sharedAuthSecret } from '../src/lib/shipper-shared-auth.mjs';

const userId = '9aa10000-1111-4111-8111-222222222222';
const secret = 'test-secret-at-least-32-bytes-long-not-production';
const chunksFor = token => token.split('.');

test('Shipper uses the same gpv1 HMAC signing protocol as Admin, not an independent secret', () => {
  const now = Date.UTC(2026, 9, 27, 5, 0, 0);
  const token = createSharedShipperToken({ user_id: userId, email: 'shipper@example.test' }, secret, now);
  assert.match(token, /^gpv1\./);
  assert.equal(verifySharedShipperToken(token, secret, now), userId);
  assert.equal(verifySharedShipperToken(token, secret, now + 8 * 3600_000), null);
  assert.equal(verifySharedShipperToken(token, `${secret}-wrong`, now), null);
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  assert.equal(payload.role, 'shipper');
  assert.equal(payload.userId, userId);
  const adminCompatibleSignature = createHmac('sha256', secret).update(chunksFor(token)[1]).digest('base64url');
  assert.equal(chunksFor(token)[2], adminCompatibleSignature);
});

test('Shared Shipper verifier rejects tampered, expired, forged-role and malformed tokens', () => {
  const now = Date.UTC(2026, 9, 27, 5, 0, 0);
  const token = createSharedShipperToken({ user_id: userId, email: 'shipper@example.test' }, secret, now);
  const chunks = token.split('.');
  assert.equal(verifySharedShipperToken(`${chunks[0]}.${chunks[1]}.${chunks[2].slice(1)}a`, secret, now), null);
  assert.equal(verifySharedShipperToken('not-a-session', secret, now), null);
  assert.equal(verifySharedShipperToken(undefined, secret, now), null);
  assert.equal(verifySharedShipperToken(token, secret, now - 120_000), null);
  const payload = JSON.parse(Buffer.from(chunks[1], 'base64url').toString('utf8'));
  payload.role = 'admin';
  const altered = Buffer.from(JSON.stringify(payload)).toString('base64url');
  assert.equal(verifySharedShipperToken(`gpv1.${altered}.${chunks[2]}`, secret, now), null);
  const adminSignature = createHmac('sha256', secret).update(altered).digest('base64url');
  assert.equal(verifySharedShipperToken(`gpv1.${altered}.${adminSignature}`, secret, now), null);
  assert.throws(() => sharedAuthSecret({ AUTH_HANDOFF_SECRET: 'weak' }), /shorter than 32/);
  assert.equal(sharedAuthSecret({ AUTH_HANDOFF_SECRET: secret }), secret);
  assert.equal(sharedAuthSecret({ AUTH_SESSION_SECRET: secret }), secret);
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
