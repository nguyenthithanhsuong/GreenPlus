import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const callers = [
  ['web-shipper/src/app/help/page.tsx', 'help'],
  ['web-shipper/src/app/support/live/page.tsx', 'message'],
  ['web-shipper/src/frontend/ai/ShipperAiChat.tsx', 'ai'],
  ['web-shipper/src/frontend/ai/ShipperSupport.tsx', 'support'],
  ['web-shipper/src/frontend/dashboard/Dashboard.tsx', 'orders'],
  ['web-shipper/src/frontend/profile/Profile.tsx', 'profile'],
  ['web-shipper/src/frontend/scan/Scan.tsx', 'scan'],
];

test('all seven ShipperShell callers use serializable, mapped icon identifiers', () => {
  const shell = read('web-shipper/src/frontend/shared/ShipperShell.tsx');
  assert.match(shell, /^"use client";/m);
  assert.match(shell, /icon:\s*keyof typeof headingIcons/);
  assert.match(shell, /const HeaderIcon = headingIcons\[icon\]/);
  assert.match(shell, /<HeaderIcon size=\{20\}\s*\/>/);
  assert.doesNotMatch(shell, /icon:\s*LucideIcon/);
  for (const [path, icon] of callers) {
    const source = read(path);
    const index = source.indexOf('<ShipperShell');
    assert.notEqual(index, -1, `${path}: missing ShipperShell`);
    const attrs = source.slice(index, source.indexOf('>', index) + 1);
    assert.match(attrs, new RegExp(`\\bicon="${icon}"`), `${path}: expected ${icon}`);
    assert.doesNotMatch(attrs, /icon=\{/, `${path}: icon component crosses boundary`);
    assert.match(shell, new RegExp(`\\b${icon}:\\s*[A-Z]\\w*`), `${icon}: missing client mapping`);
  }
});

test('Shipper help and live support routes remain available', () => {
  const help = read('web-shipper/src/app/help/page.tsx');
  const support = read('web-shipper/src/app/support/live/page.tsx');
  assert.match(help, /export default function ShipperHelpPage/);
  assert.match(help, /href:\s*'\/support\/live'/);
  assert.match(support, /await requireShipperPage\(\)/);
  assert.match(support, /<LiveSupportView/);
});
