import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

// Regression for Next.js RSC error: a server page must not pass a Lucide
// component function as a prop into ShipperShell (a Client Component).
test('ShipperShell receives a serializable icon identifier from server pages', () => {
  const shell = read('web-shipper/src/frontend/shared/ShipperShell.tsx');
  const help = read('web-shipper/src/app/help/page.tsx');
  const support = read('web-shipper/src/app/support/live/page.tsx');

  assert.match(shell, /^"use client";/m);
  assert.match(shell, /icon:\s*"help"\s*\|\s*"message"/);
  assert.match(shell, /icon\s*===\s*"help"\s*\?/);
  assert.doesNotMatch(shell, /icon:\s*LucideIcon/);

  assert.match(help, /icon="help"/);
  assert.match(support, /icon="message"/);
  assert.doesNotMatch(help, /icon=\{[A-Z]\w*\}/);
  assert.doesNotMatch(support, /icon=\{[A-Z]\w*\}/);
});

test('Shipper help and live support routes remain available', () => {
  const help = read('web-shipper/src/app/help/page.tsx');
  const support = read('web-shipper/src/app/support/live/page.tsx');
  assert.match(help, /export default function ShipperHelpPage/);
  assert.match(help, /href:\s*'\/support\/live'/);
  assert.match(support, /await requireShipperPage\(\)/);
  assert.match(support, /<LiveSupportView/);
});
