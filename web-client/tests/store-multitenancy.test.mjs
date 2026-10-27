import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(import.meta.dirname, '..');

function loadTs(rel, injected = {}) {
  const code = fs.readFileSync(path.join(root, rel), 'utf8');
  const { outputText } = ts.transpileModule(code, {
    fileName: rel,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  vm.runInNewContext(`(function(module, exports, require, window, fetch, URL, CustomEvent) { ${outputText}\n })`,
    {}, { filename: rel })(
    module, module.exports,
    (name) => {
      if (Object.hasOwn(injected, name)) return injected[name];
      throw new Error(`Unexpected import: ${name}`);
    },
    globalThis.window,
    globalThis.fetch,
    URL,
    globalThis.CustomEvent,
  );
  return module.exports;
}

function init() {
  const entries = new Map();
  const sent = [];
  globalThis.window = {
    location: { origin: 'http://localhost:3000' },
    localStorage: {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
      removeItem: (key) => entries.delete(key),
    },
    dispatchEvent: (event) => sent.push(event),
  };
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
  const selections = loadTs('src/lib/stores/store-selection.ts');
  let calls = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return { ok: true, status: 200 };
  };
  const { storeFetch } = loadTs('src/lib/stores/store-fetch.ts', { './store-selection': selections });
  return { selections, storeFetch, calls, sent, entries };
}

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

test('GET cart and orders use explicitly selected store', async () => {
  const { selections, storeFetch, calls } = init();
  selections.selectStore(STORE_A);
  await storeFetch('/api/cart?userId=abc');
  await storeFetch('/api/orders?userId=abc');
  assert.equal(new URL(calls[0].input, 'http://localhost').searchParams.get('storeId'), STORE_A);
  assert.equal(new URL(calls[1].input, 'http://localhost').searchParams.get('storeId'), STORE_A);
});

test('JSON mutations for cart, order, cancel and payment carry storeId', async () => {
  const { selections, storeFetch, calls } = init();
  selections.selectStore(STORE_A);
  for (const [endpoint, method] of [
    ['/api/cart', 'POST'],
    ['/api/cart', 'PUT'],
    ['/api/cart', 'DELETE'],
    ['/api/cart/note', 'PUT'],
    ['/api/orders', 'POST'],
    ['/api/orders/order-123/cancel', 'PUT'],
    ['/api/orders/order-123/confirm-payment', 'PUT'],
  ]) {
    await storeFetch(endpoint, { method, body: JSON.stringify({ userId: 'abc' }) });
  }
  for (const call of calls) {
    assert.equal(new URL(call.input, 'http://localhost').searchParams.get('storeId'), STORE_A);
    assert.equal(JSON.parse(call.init.body).storeId, STORE_A);
  }
});

test('changing store affects subsequent requests, without leaking previous store', async () => {
  const { selections, storeFetch, calls } = init();
  selections.selectStore(STORE_A);
  await storeFetch('/api/products');
  selections.selectStore(STORE_B);
  await storeFetch('/api/cart');
  assert.equal(new URL(calls[0].input,'http://localhost').searchParams.get('storeId'), STORE_A);
  assert.equal(new URL(calls[1].input,'http://localhost').searchParams.get('storeId'), STORE_B);
});

test('missing selection blocks tenant requests, never silently chooses a store', async () => {
  const { selections, storeFetch, calls } = init();
  await assert.rejects(storeFetch('/api/cart'), /Vui lòng chọn cửa hàng/);
  selections.selectStore(STORE_A);
  selections.clearSelectedStore();
  await assert.rejects(storeFetch('/api/orders'), /Vui lòng chọn cửa hàng/);
  assert.equal(calls.length, 0);
});

test('key screens use tenant-aware fetch and expose store switcher', () => {
  const files = [
    'frontend/orders/components/Orders.tsx',
    'frontend/orders/components/OrderDetail.tsx',
    'frontend/payment/components/Payment.tsx',
    'frontend/payment/components/OrderPaymentPage.tsx',
    'src/app/profile/transaction-history/page.tsx',
    'frontend/complaints/components/Complaints.tsx',
    'frontend/subscriptions/components/SubscriptionsManagementPage.tsx',
    'frontend/group-purchase/components/CreateGroupPurchasePage.tsx',
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /CommerceStorePicker/, file);
    assert.match(source, /storeFetch\(/, file);
    // Only the complaints list is global and intentionally fetched without storeId.
    if (!file.includes('Complaints')) {
      assert.doesNotMatch(source, /\bawait\s+fetch\s*\(/, file);
    }
  }
});
