import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const component = readFileSync(
  fileURLToPath(new URL('../web-client/frontend/stores/StoreSelector.tsx', import.meta.url)),
  'utf8',
);

// Exercise the actual derived-value expression used by the controlled input.
const expression = component.match(/const address\s*=\s*([\s\S]*?);\s*const \[resolvedAddress/);
assert.ok(expression, 'StoreSelector must derive the address from the signed-in profile');
const getAddress = new Function('addressDraft', 'authUserId', 'authUser', `return (${expression[1]});`);

test('uses the signed-in customer address without submitting it to geocoding', () => {
  assert.equal(getAddress(null, 'customer-a', { address: ' 12 Lê Lợi, TP.HCM ' }), '12 Lê Lợi, TP.HCM');
  assert.match(component, /onSubmit=\{\(event\) => void locateFromAddress\(event\)\}/);
});

test('keeps manual edits, even when the customer clears the input', () => {
  assert.equal(getAddress({ userId: 'customer-a', value: 'Địa chỉ mới' }, 'customer-a', { address: 'Địa chỉ cũ' }), 'Địa chỉ mới');
  assert.equal(getAddress({ userId: 'customer-a', value: '' }, 'customer-a', { address: 'Địa chỉ cũ' }), '');
});

test('does not reuse another customer address after switching accounts', () => {
  assert.equal(getAddress({ userId: 'customer-a', value: 'Nhập bởi A' }, 'customer-b', { address: 'Hồ sơ B' }), 'Hồ sơ B');
  assert.equal(getAddress({ userId: null, value: 'Khách chưa đăng nhập' }, 'customer-a', { address: 'Hồ sơ A' }), 'Hồ sơ A');
});

test('guests or profiles without saved addresses start with an empty field', () => {
  assert.equal(getAddress(null, null, null), '');
  assert.equal(getAddress(null, 'customer-c', { address: null }), '');
});
