import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
test('Docker command timeouts distinguish slow startup from missing executable', () => {
  const source = read('../scripts/three-tier-docker.mjs');
  assert.match(source, /isStartup \? 900000/);
  assert.match(source, /r\.error\.code === 'ETIMEDOUT'/);
  assert.match(source, /r\.error\.code === 'ENOENT'/);
  assert.doesNotMatch(source, /Docker unavailable:/);
});
test('admin mode preference is role restricted and never changes production routing', () => {
  const api = read('../web-admin/src/app/api/settings/storage-mode/route.ts');
  assert.match(api, /actor\.role === "admin"/);
  assert.match(api, /httpOnly: true/);
  assert.match(api, /sameSite: "strict"/);
  assert.match(api, /scope: "admin-sandbox-only"/);
  assert.match(api, /Forbidden origin/);
});
test('Admin settings UI uses a minimal accessible switch', () => {
  const ui = read('../web-admin/frontend/settings/StorageModeSetting.tsx');
  assert.match(ui, /Supabase Online/);
  assert.match(ui, /Docker Local/);
  assert.match(ui, /role="switch"/);
  assert.doesNotMatch(ui, /Lưu ý:/);
  assert.match(read('../web-admin/frontend/settings/SettingsManagement.tsx'), /<StorageModeSetting \/>/);
});
