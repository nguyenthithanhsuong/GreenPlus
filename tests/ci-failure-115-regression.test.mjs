import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const spec = readFileSync(new URL('../web-shipper/e2e/shipper.spec.ts', import.meta.url), 'utf8');

test('shipper login E2E confirms React hydration before submitting', () => {
  const hydrate = spec.indexOf('getByRole("button", { name: "Hiện mật khẩu" }).click()');
  const hydrated = spec.indexOf('getByRole("button", { name: "Ẩn mật khẩu" })');
  const submit = spec.indexOf('getByRole("button", { name: "Đăng nhập" }).click()');
  assert.ok(hydrate > 0 && hydrated > hydrate && submit > hydrated);
  assert.match(spec, /toHaveAttribute\(\s*"type",\s*"text"/);
});

test('shipper login E2E checks mocked request, 401 response and rendered alert', () => {
  assert.match(spec, /page\.route\("\*\*\/api\/auth\/sign-in"/);
  assert.match(spec, /expect\(credentials\)\.toEqual/);
  assert.match(spec, /status: 401/);
  assert.match(spec, /page\.waitForResponse/);
  assert.match(spec, /expect\(\(await signInResponse\)\.status\(\)\)\.toBe\(401\)/);
  assert.match(spec, /getByRole\("alert"\)\)\.toContainText/);
});

test('shipper API security E2E still asserts real unauthenticated requests', () => {
  assert.match(spec, /request\.get\("\/api\/shipper\/deliveries"\)/);
  assert.match(spec, /expect\(response\.status\(\)\)\.toBe\(401\)/);
  assert.match(spec, /request\.post\("\/api\/auth\/sign-in"/);
  assert.match(spec, /expect\(response\.status\(\)\)\.toBe\(400\)/);
});
