import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../docker/three-tier/gateway/server.mjs', import.meta.url), 'utf8');
test('catalog gateway only accepts named resource paths, store UUID and item UUID', () => {
  assert.match(source, /catalogMatch = \/\^\\\/stores/);
  assert.match(source, /uuid\.test\(catalogMatch\[1\]\)/);
  assert.match(source, /uuid\.test\(catalogMatch\[3\]\)/);
});
test('catalog writes never accept client-controlled store_id or record identifiers', () => {
  assert.match(source, /const ALLOWED = Object\.freeze/);
  assert.match(source, /keys\.some\(\(key\) => !ALLOWED\[kind\]\.has\(key\)\)/);
  assert.match(source, /\{ \.\.\.fields, store_id: storeId, \[idColumn\]: randomUUID\(\) \}/);
});
test('catalog selects backend by registered tenant and constrains every mutation to store', () => {
  assert.match(source, /storageForTenant\(tenant\)/);
  assert.match(source, /store_id=eq\.\$\{storeId\}/);
  assert.match(source, /const path = `\/\$\{table\}\?\$\{scope\}/);
});
test('product category must belong to the current store', () => {
  assert.match(source, /category_id=eq\.\$\{fields\.category_id\}/);
  assert.match(source, /Invalid category_id for store/);
});
test('legacy store products endpoint remains intact', () => {
  assert.match(source, /async function productsForStore/);
  assert.match(source, /\/stores\\\/\(\[0-9a-f-\]\{36\}\)\\\/products/);
});
