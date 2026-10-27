import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const stock = await import('../web-client/backend/modules/products/product-stock.ts');
const at = new Date('2026-10-27T12:00:00+07:00');

test('only positive inventory in active, unexpired batches is sellable', () => {
  assert.equal(stock.isSellableBatch('available', '2026-10-28', 3, at), true);
  assert.equal(stock.isSellableBatch('available', '2026-10-27', 1, at), true);
  assert.equal(stock.isSellableBatch('available', '2026-10-26', 3, at), false);
  assert.equal(stock.isSellableBatch('expired', '2026-11-28', 3, at), false);
  assert.equal(stock.isSellableBatch('sold_out', '2026-11-28', 3, at), false);
  assert.equal(stock.isSellableBatch('available', '2026-11-28', 0, at), false);
  assert.equal(stock.isSellableBatch('available', null, 3, at), false);
});

test('product browse availability uses actual per-store sellable stock', () => {
  const service = read('web-client/backend/modules/products/product.service.ts');
  const repo = read('web-client/backend/modules/products/product.repository.ts');
  assert.match(service, /getSellableStockMap\(productIds, storeId\)/);
  assert.match(service, /sellableStockMap\.get\(product\.product_id\)/);
  assert.doesNotMatch(service, /isAvailable: true/);
  assert.match(repo, /\.from\("inventory"\)/);
  assert.match(repo, /\.eq\("store_id", storeId\)/);
});

test('cart checks expiry and batch status before stock check', () => {
  const repo = read('web-client/backend/modules/cart/cart.repository.ts');
  assert.match(repo, /\.filter\(\(row\) => isSellableBatch\(row\.status, row\.expire_date, 1\)\)/);
});

test('detail and related product requests carry selected store, and reload on store change', () => {
  const detail = read('web-client/frontend/product-detail/components/ProductDetail.tsx');
  assert.match(detail, /detailResponse = await storeFetch\(/);
  assert.match(detail, /relatedResponse = await storeFetch\(/);
  assert.match(detail, /\[productId, storeRevision\]/);
  assert.match(detail, /<StoreSelector \/>/);
});

test('all product browsing surfaces allow changing store and reload when changed', () => {
  for (const file of [
    'web-client/frontend/category/components/Category.tsx',
    'web-client/frontend/category-products/components/CategoryProducts.tsx',
  ]) {
    const source = read(file);
    assert.match(source, /STORE_CHANGE_EVENT/);
    assert.match(source, /<StoreSelector \/>/);
    assert.match(source, /storeRevision/);
  }
});

test('storeFetch never silently queries store-scoped APIs with no selected store', () => {
  const source = read('web-client/src/lib/stores/store-fetch.ts');
  assert.match(source, /if \(!storeId\) \{/);
  assert.match(source, /Vui lòng chọn cửa hàng/);
});
