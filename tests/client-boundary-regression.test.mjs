import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const clientFiles = [
  'web-client/frontend/dashboard/components/Dashboard.tsx',
  'web-client/frontend/category/components/Category.tsx',
  'web-client/frontend/category-products/components/CategoryProducts.tsx',
  'web-client/frontend/group-purchase/components/CreateGroupPurchasePage.tsx',
  'web-client/frontend/product-detail/components/GroupPurchaseModal.tsx',
  'web-client/frontend/product-detail/components/ProductDetail.tsx',
  'web-client/frontend/subscriptions/components/SubscriptionsManagementPage.tsx',
  'web-client/frontend/complaints/components/Complaints.tsx',
  'web-client/frontend/payment/components/Payment.tsx',
  'web-client/frontend/orders/components/OrderDetail.tsx',
  'web-client/frontend/orders/components/Orders.tsx',
];
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('all known client components keep use client as first statement', () => {
  for (const path of clientFiles) {
    assert.match(read(path), /^\s*["']use client["'];/, path);
  }
});

test('store selector starts auto recommendation after async store loading, not synchronously in an effect', () => {
  const source = read('web-client/frontend/stores/StoreSelector.tsx');
  assert.match(source, /const recommend = useCallback/);
  assert.match(source, /if \(list\.length > 1\) recommend\(list, false, \(\) => active\)/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{\s*if \(stores\.length > 1\)/);
  assert.match(source, /permission\.state === "granted"/);
  assert.match(source, /\[recommend\]\)/);
});

test('store selector avoids overriding a valid selected store with geolocation', () => {
  const source = read('web-client/frontend/stores/StoreSelector.tsx');
  assert.match(source, /if \(!list\.some\(\(store\) => store\.store_id === saved\)\)/);
  assert.match(source, /selectStore\(closest\.store\.store_id\)/);
  assert.match(source, /recommend\(stores, true\)/);
});
