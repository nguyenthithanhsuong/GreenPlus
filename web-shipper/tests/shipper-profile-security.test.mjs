import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeShipperProfile } from '../src/lib/shipper-profile.mjs';

const content = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');

test('profile accepts and trims contact fields only', () => {
  assert.deepEqual(normalizeShipperProfile({ name: '  Nguyen  Van  A ', phone: '+84901234567', address: '  Ho Chi Minh  ' }),
    { name: 'Nguyen Van A', phone: '+84901234567', address: 'Ho Chi Minh' });
  assert.deepEqual(normalizeShipperProfile({ name: 'Nguyen Van B', phone: '', address: '' }),
    { name: 'Nguyen Van B', phone: null, address: null });
});

test('profile rejects unknown fields including role, email, user ID and store ID', () => {
  for (const key of ['email','role_id','store_id','user_id','status','password']) {
    assert.equal(normalizeShipperProfile({ name: 'Shipper Name', phone: '', address: '', [key]: 'malicious' }), null);
  }
});

test('profile rejects malformed and excessive contact data', () => {
  for (const payload of [null, [], {}, {name:'a',phone:'',address:''},
    {name:'Name', phone:'abc',address:''}, {name:'Name',phone:'',address:'a'.repeat(501)},
    {name:'Name',phone:7,address:''}]) assert.equal(normalizeShipperProfile(payload), null);
});

test('profile edits require cookie-based shipper authentication and guard origin', () => {
  const route = content('../src/app/api/auth/me/route.ts');
  assert.match(route, /export async function PATCH/);
  assert.match(route, /requireShipper\(\)/);
  assert.match(route, /get\("origin"\)/);
  assert.match(route, /\.eq\("user_id", user\.user_id\)/);
  assert.match(route, /normalizeShipperProfile/);
  assert.doesNotMatch(route, /localhost:3001|GREENPLUS_SHIPPER_API_BASE_URL/);
});

test('password update verifies current password and compares previous hash', () => {
  const route = content('../src/app/api/auth/change-password/route.ts');
  assert.match(route, /requireShipper\(\)/);
  assert.match(route, /verifyPassword/);
  assert.match(route, /hashPassword/);
  assert.match(route, /\.eq\("password", data\.password\)/);
  assert.match(route, /get\("origin"\)/);
});

test('mobile Shipper shell matches Web Client 500px canvas and background', () => {
  const css = content('../src/app/globals.css');
  assert.match(css, /--gp-max-width:\s*500px/);
  assert.match(css, /linear-gradient\(160deg, #0f172a 0%, #115e59 55%, #10b981 100%\)/);
  assert.match(css, /\.gp-phone-frame/);
  assert.match(css, /\.gp-mobile-navigation/);
  assert.doesNotMatch(css, /grid-template-columns:\s*236px/);
});
