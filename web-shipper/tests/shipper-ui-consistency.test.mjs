import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('dashboard, profile, and scan use the same shared shell', () => {
  for (const file of ['../src/frontend/dashboard/Dashboard.tsx','../src/frontend/profile/Profile.tsx','../src/frontend/scan/Scan.tsx']) {
    const data = source(file);
    assert.match(data, /import ShipperShell/);
    assert.match(data, /<ShipperShell /);
    assert.doesNotMatch(data, /<NavigationBar\s*\/>/);
  }
});

test('desktop and mobile navigation share routes and active state', () => {
  const nav = source('../src/frontend/dashboard/NavigationBar.tsx');
  for (const page of ['/', '/scan', '/profile']) assert.ok(nav.includes(`href: "${page}"`));
  assert.match(nav, /aria-current/);
  assert.match(nav, /"desktop" \| "mobile"/);
});

test('a fixed scrollbar gutter and scrolling prevent horizontal tab jumps', () => {
  const css = source('../src/app/globals.css');
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /overflow-y:\s*scroll/);
  assert.match(css, /\.gp-app\s*\{/);
});

test('login feedback space remains stable and is announced accessibly', () => {
  const login = source('../src/app/login/page.tsx');
  assert.match(login, /h-\[84px\]/);
  assert.match(login, /aria-live="polite"/);
  assert.match(login, /role="alert"/);
});

test('search result, map and sign-out confirmation use one modal', () => {
  for (const file of ['../src/frontend/scan/Scan.tsx','../src/frontend/profile/Profile.tsx','../src/frontend/map/DeliveryMapPanel.tsx']) {
    const data = source(file);
    assert.match(data, /import Modal/);
    assert.match(data, /<Modal /);
  }
  assert.match(source('../src/frontend/shared/Modal.tsx'), /aria-modal="true"/);
});
