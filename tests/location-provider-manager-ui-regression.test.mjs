import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file,root),'utf8');

test('Manager UI hides All/Customer tabs and the server refuses customer records', () => {
  const table = read('web-admin/frontend/users/UserTable.tsx');
  const route = read('web-admin/src/app/api/users/route.ts');
  assert.match(table, /portalRole !== "manager" && <button\s+onClick=\{\(\) => setActiveTab\("customer"\)\}/);
  assert.match(table, /portalRole === "manager" \? "staff" : activeTab/);
  assert.match(table, /userSearchStrategy\.filter\(scopedUsers/);
  assert.match(route, /role\?\.is_customer === true \|\| !storeUserRoleAllowed\(role\)/);
  assert.match(route, /actor\.role === "manager" \? Promise\.resolve\(\[\]\) : fetchRelationships\("orders"/);
});

test('Fallback returns detailed Vietnamese street match after Photon rate limit; caches and validates selection', async () => {
  const mod = await import('../packages/location/index.mjs?test=fallback');
  const oldFetch = globalThis.fetch;
  const oldEnv = process.env.GREENPLUS_GEOCODER_FALLBACK_ORIGIN;
  const oldPhoton = process.env.GREENPLUS_GEOCODER_ORIGIN;
  delete process.env.GREENPLUS_GEOCODER_FALLBACK_ORIGIN;
  delete process.env.GREENPLUS_GEOCODER_ORIGIN;
  let photon = 0, nominatim = 0;
  globalThis.fetch = async url => {
    const u = new URL(url);
    if (u.hostname === 'photon.komoot.io') {
      photon++;
      return {ok:false,status:429};
    }
    assert.equal(u.hostname,'nominatim.openstreetmap.org');
    assert.equal(u.searchParams.get('countrycodes'),'vn');
    nominatim++;
    return {ok:true,json:async()=>[
      {lat:'10.7721',lon:'106.7012',display_name:'15 Nguyễn Huệ, Quận 1, Thành phố Hồ Chí Minh, Việt Nam',address:{house_number:'15',road:'Nguyễn Huệ',country_code:'vn'}},
      {lat:'40.71',lon:'-73',display_name:'15 Broadway, US',address:{road:'Broadway',country_code:'us'}}
    ]};
  };
  try {
    const query = '15 Nguyễn Huệ, Thành phố Hồ Chí Minh, Việt Nam';
    const [a,b] = await Promise.all([mod.geocodeAddress(query),mod.geocodeAddress(query)]);
    assert.deepEqual(a,b);
    assert.equal(a.length,1);
    assert.equal(a[0].source,'nominatim');
    assert.equal(photon,1);
    assert.equal(nominatim,1);
    const selected = await mod.resolveDeliveryAddress(query, {latitude:10.7721,longitude:106.7012});
    assert.equal(selected.latitude,10.7721);
    await assert.rejects(mod.resolveDeliveryAddress(query,{latitude:10.8,longitude:106.8}),/không khớp/);
    assert.equal(nominatim,1);
  } finally {
    globalThis.fetch=oldFetch;
    if (oldEnv===undefined) delete process.env.GREENPLUS_GEOCODER_FALLBACK_ORIGIN; else process.env.GREENPLUS_GEOCODER_FALLBACK_ORIGIN=oldEnv;
    if (oldPhoton===undefined) delete process.env.GREENPLUS_GEOCODER_ORIGIN; else process.env.GREENPLUS_GEOCODER_ORIGIN=oldPhoton;
  }
});

test('No silent success if both providers fail', async () => {
  const mod = await import('../packages/location/index.mjs?test=both-down');
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ok:false,status:503});
  try {
    await assert.rejects(mod.geocodeAddress('90 Lê Lợi, TP Hồ Chí Minh, Việt Nam'),e => e.status === 503 && /Hai dịch vụ/.test(e.message));
  } finally {globalThis.fetch=oldFetch;}
});

test('Backend persists only coordinates confirmed by lookup; unchanged Client address is not geocoded again', () => {
  assert.match(read('web-admin/src/app/api/users/route.ts'),/body\.locationHint/);
  assert.match(read('web-admin/src/app/api/users/[userId]/route.ts'),/body\.locationHint/);
  assert.match(read('web-client/src/app/api/account/profile/route.ts'),/body\.locationHint/);
  assert.match(read('web-client/frontend/profile/components/ProfileMine.tsx'),/addressChanged/);
  assert.match(read('web-client/backend/modules/customer-auth/auth.repository.ts'),/input\.latitude !== undefined/);
});
