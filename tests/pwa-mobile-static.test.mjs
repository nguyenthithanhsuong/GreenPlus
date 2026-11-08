import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
for (const app of ['web-client','web-shipper']) {
  test(`${app}: install assets, safe service worker updates and uncached SW`, async () => {
    for (const path of [
      'src/app/manifest.ts','src/app/PwaRegister.tsx',
      'src/app/.well-known/assetlinks.json/route.ts','public/sw.js',
      'public/offline.html','public/icons/icon-192.png',
      'public/icons/icon-512.png','public/icons/icon-512-maskable.png',
    ]) assert.ok(existsSync(resolve(root, app, path)), path);

    const source = readFileSync(resolve(root, app, 'public/sw.js'), 'utf8');
    const config = readFileSync(resolve(root, app, 'next.config.ts'), 'utf8');
    const registration = readFileSync(resolve(root, app, 'src/app/PwaRegister.tsx'), 'utf8');
    assert.match(config, /source: "\/sw\.js"/);
    assert.match(config, /no-cache, no-store, must-revalidate/);
    assert.match(registration, /updateViaCache: "none"/);
    assert.match(registration, /registration\.waiting\.postMessage/);
    assert.doesNotMatch(source, /cache\.put\(request|cache\.add\(request/);
    const events = {};
    const keys = [];
    let skipWaitingCount = 0;
    let cacheWrites = [];
    const fakeCache = { addAll: async (paths) => { cacheWrites = paths; } };
    const self = {
      location: { origin: 'https://greenplus.example' },
      addEventListener: (name, fn) => { events[name] = fn; },
      skipWaiting: () => { skipWaitingCount++; },
      clients: { claim: async () => {} },
    };
    const caches = {
      open: async () => fakeCache,
      keys: async () => keys,
      delete: async () => true,
      match: async (key) => key === '/offline.html' ? 'offline-shell' : null,
    };
    vm.runInNewContext(source, { self, caches, URL, Response, fetch: async () => { throw Error('offline'); } });
    let installWork;
    events.install({waitUntil: (value) => { installWork = value; }});
    await installWork;
    assert.deepEqual(Array.from(cacheWrites), ['/offline.html','/icons/icon-192.png','/icons/icon-512.png']);
    assert.equal(skipWaitingCount, 0, 'do not replace an active checkout without consent');
    events.message({data:{type:'SKIP_WAITING'}});
    assert.equal(skipWaitingCount, 1);

    const fetchEvent = (mode, pathname, method = 'GET') => {
      let response;
      events.fetch({request: {mode,method,url:`https://greenplus.example${pathname}`},respondWith: (value) => {response=value;}});
      return response;
    };
    assert.equal(fetchEvent('cors','/api/orders'), undefined);
    assert.equal(fetchEvent('navigate','/api/orders'), undefined);
    assert.equal(fetchEvent('navigate','/payment','POST'), undefined);
    assert.equal(await fetchEvent('navigate','/orders'), 'offline-shell');
  });
}
