import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('product detail no longer updates invisible debug React state on each fetch', () => {
  const source = read('web-client/frontend/product-detail/components/ProductDetail.tsx');
  assert.doesNotMatch(source, /\bsetDebugSteps\b|\bupdateStep\s*\(/);
  assert.doesNotMatch(source, /<section style=\{styles\.debugPanel\}>/);
});

test('subscription loader is a stable callback with explicit user id', () => {
  const source = read('web-client/src/app/backend/products/subscriptions/page.tsx');
  assert.match(source, /const loadSubscriptions = useCallback\(async \(resolvedUserId: string\)/);
  assert.match(source, /\[activeUserId, loadSubscriptions\]/);
  assert.match(source, /loadSubscriptions\(activeUserId\)/);
});

test('retired admin debug UI cannot render credentials and health response is sanitized', () => {
  const panel = read('web-admin/frontend/settings/UserDebugPanel.tsx');
  assert.match(panel, /return null;/);
  assert.doesNotMatch(panel, /JSON\.stringify|access_token|refresh_token|useAuthStore/);
  const health = read('web-admin/src/app/api/health/route.ts');
  assert.match(health, /message: "Health check failed"/);
  assert.doesNotMatch(health, /message: error instanceof Error/);
  assert.doesNotMatch(health, /Health check attempt/);
});
