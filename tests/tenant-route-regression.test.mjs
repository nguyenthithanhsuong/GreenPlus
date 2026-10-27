import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('public auth/health must not require an existing admin cookie',()=>{
  const wrapper=read('web-admin/src/lib/with-sentry.ts');
  assert.match(wrapper,/if \(options\.publicRoute\) return await handler/);
  for(const file of ['auth/sign-in/route.ts','auth/route.ts','health/route.ts']){
    assert.match(read(`web-admin/src/app/api/${file}`),/publicRoute:\s*true/);
  }
});

test('individual order and inventory routes are tenant-protected',()=>{
  for(const file of ['orders/[orderId]/route.ts','inventory/[inventoryId]/route.ts']){
    const source=read(`web-admin/src/app/api/${file}`);
    assert.match(source,/withSentry\(handle/);
    assert.doesNotMatch(source,/export async function (GET|PUT|PATCH|DELETE)/);
  }
});
