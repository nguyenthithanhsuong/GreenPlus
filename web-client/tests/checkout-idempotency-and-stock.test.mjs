import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCheckoutIdempotencyKey, clearCheckoutIdempotencyKey } from '../src/lib/orders/checkout-idempotency.ts';
import { isSellableBatch } from '../backend/modules/products/product-stock.ts';

const backing = new Map();
globalThis.sessionStorage = {
  getItem: (key) => backing.get(key) ?? null,
  setItem: (key,value) => backing.set(key,String(value)),
  removeItem: (key) => backing.delete(key),
};
const ctx = (change={}) => ({
  userId:'user-1',storeId:'store-1',cartId:'cart-1',
  items:[{cart_item_id:'line-1',quantity:2,note:''}],
  deliveryAddress:'42 Sample St',deliveryFee:15000,paymentMethod:'cod',
  ...change,
});
test('checkout key is valid and stable across retries and same-tab reloads', () => {
  backing.clear();
  const first=getCheckoutIdempotencyKey(ctx());
  assert.match(first,/^[A-Za-z0-9._:-]{8,128}$/);
  assert.equal(getCheckoutIdempotencyKey(ctx()),first);
});
test('checkout key varies by store, cart contents and address', () => {
  backing.clear();
  const first=getCheckoutIdempotencyKey(ctx());
  assert.notEqual(getCheckoutIdempotencyKey(ctx({storeId:'store-2'})),first);
  assert.notEqual(getCheckoutIdempotencyKey(ctx({items:[{cart_item_id:'line-1',quantity:3}]})),first);
  assert.notEqual(getCheckoutIdempotencyKey(ctx({deliveryAddress:'17 Another St'})),first);
});
test('one success clears only the associated cart key', () => {
  backing.clear();
  const initial=getCheckoutIdempotencyKey(ctx());
  const other=getCheckoutIdempotencyKey(ctx({cartId:'cart-2'}));
  clearCheckoutIdempotencyKey(ctx());
  assert.notEqual(getCheckoutIdempotencyKey(ctx()),initial);
  assert.equal(getCheckoutIdempotencyKey(ctx({cartId:'cart-2'})),other);
});
test('tampered cached identifier cannot be reused', () => {
  backing.clear();
  const c=ctx();const original=getCheckoutIdempotencyKey(c);
  const key=[...backing.keys()][0];const raw=JSON.parse(backing.get(key));
  backing.set(key,JSON.stringify({...raw,value:'bad key!'}));
  const next=getCheckoutIdempotencyKey(c);
  assert.notEqual(next,'bad key!');assert.match(next,/^[A-Za-z0-9._:-]{8,128}$/);
  assert.notEqual(next,original);
});
test('both customer checkout entrypoints send Idempotency-Key and idempotencyKey', () => {
  for (const path of ['frontend/orders/components/Orders.tsx','frontend/payment/components/Payment.tsx']) {
    const src=readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
    assert.match(src,/getCheckoutIdempotencyKey\(checkoutContext\)/);
    assert.match(src,/'?"Idempotency-Key"?: idempotencyKey/);
    assert.match(src,/\s+idempotencyKey,\s*\n/);
    assert.match(src,/clearCheckoutIdempotencyKey\(checkoutContext\)/);
    assert.match(src,/checkoutInFlight\.current/);
  }
});
test('API rejects missing or mismatching keys before geocoding', () => {
  const src=readFileSync(new URL('../src/app/api/orders/route.ts',import.meta.url),'utf8');
  assert.ok(src.indexOf('INVALID_IDEMPOTENCY_KEY')<src.indexOf('resolveDeliveryAddress(deliveryAddress)'));
  assert.match(src,/IDEMPOTENCY_KEY_MISMATCH/);
});
test('batch with 100 units of available stock is sellable', () => {
  assert.equal(isSellableBatch('available','2030-12-31',100,new Date('2026-10-27T00:00:00Z')),true);
  assert.equal(isSellableBatch('available','2030-12-31',0,new Date('2026-10-27T00:00:00Z')),false);
  assert.equal(isSellableBatch('expired','2030-12-31',100,new Date('2026-10-27T00:00:00Z')),false);
});
test('product cards separate physical stock from missing price', () => {
  const src=readFileSync(new URL('../backend/modules/products/product.service.ts',import.meta.url),'utf8');
  assert.match(src,/const isAvailable = availableQuantity > 0/);
  assert.match(src,/const canPurchase = isAvailable && price !== null/);
  const repo=readFileSync(new URL('../backend/modules/products/product.repository.ts',import.meta.url),'utf8');
  assert.match(repo,/inventory\(quantity_available\)/);
  assert.match(repo,/\.eq\("inventory.store_id", storeId\)/);
  assert.match(repo,/isSellableBatch\(batch.status, batch.expire_date, available\)/);
});
