import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkedStorePickup, googleMapsNavigationUrl } from '../web-shipper/src/lib/map-helpers.mjs';

const root = new URL('../', import.meta.url);
const source = file => readFileSync(new URL(file, root), 'utf8');
const storeA = {store_id:'store-a',address:'34 Khu phố 6',ward:'Linh Xuân',city:'TP Hồ Chí Minh',latitude:10.87,longitude:106.803};
const storeB = {store_id:'store-b',address:'54 Tân Lập',ward:'Đông Hòa',city:'Dĩ An',latitude:10.8841,longitude:106.7825};

test('GreenPlus B gets its own pickup point, not store A or device GPS', () => {
  assert.deepEqual(checkedStorePickup(storeB, []), {
    pickup:{lat:storeB.latitude,lng:storeB.longitude},warning:null,
  });
  assert.notDeepEqual(checkedStorePickup(storeB, []).pickup,checkedStorePickup(storeA, []).pickup);
  const url = new URL(googleMapsNavigationUrl({lat:10.90,lng:106.81},checkedStorePickup(storeB,[]).pickup));
  assert.equal(url.searchParams.get('origin'),'10.8841,106.7825');
  assert.equal(url.searchParams.get('destination'),'10.9,106.81');
});

test('a location accidentally duplicated from a different-address store must not be routed from', () => {
  const corruptedB={...storeB,latitude:storeA.latitude,longitude:storeA.longitude};
  const result=checkedStorePickup(corruptedB,[storeA]);
  assert.equal(result.pickup,null);
  assert.match(result.warning,/trùng với cửa hàng khác/);
  assert.deepEqual(checkedStorePickup(storeB,[]),{pickup:{lat:10.8841,lng:106.7825},warning:null});
  const colocated={...storeA,store_id:'another-unit',address:storeB.address,ward:storeB.ward,city:storeB.city};
  assert.equal(checkedStorePickup({...storeB,latitude:10.87,longitude:106.803},[colocated]).warning,null);
});

test('Admin persists a specifically selected geocode result, not the first fuzzy result', async () => {
  const oldFetch=globalThis.fetch;
  const oldOrigin=process.env.GREENPLUS_GEOCODER_ORIGIN;
  process.env.GREENPLUS_GEOCODER_ORIGIN='https://photon.komoot.io';
  const results=[
    {coordinates:[storeA.longitude,storeA.latitude],properties:{street:'Khu phố 6',housenumber:'34',city:'Hồ Chí Minh',countrycode:'VN'}},
    {coordinates:[storeB.longitude,storeB.latitude],properties:{street:'Tân Lập',housenumber:'54',city:'Dĩ An',countrycode:'VN'}},
  ];
  let calls=0;
  globalThis.fetch=async () => {
    calls++;
    return {ok:true,json:async()=>({features:results.map(item=>({geometry:{coordinates:item.coordinates},properties:item.properties}))})};
  };
  try {
    const {resolveSelectedStoreAddress}=await import('../packages/location/index.mjs?test=selected-store');
    const query='54 Tân Lập, Đông Hòa, Dĩ An, Việt Nam';
    const matched=await resolveSelectedStoreAddress(query,{latitude:String(storeB.latitude),longitude:String(storeB.longitude)});
    assert.equal(matched.latitude,storeB.latitude);
    assert.equal(matched.longitude,storeB.longitude);
    assert.ok(calls>=1);
    await assert.rejects(resolveSelectedStoreAddress(query,{latitude:10.9,longitude:106.8}),/không khớp/);
    await assert.rejects(resolveSelectedStoreAddress(query,{latitude:'',longitude:''}),/Chọn và xác minh/);
    await assert.rejects(resolveSelectedStoreAddress(query,{latitude:40,longitude:-73}),/không hợp lệ/);
  } finally {
    globalThis.fetch=oldFetch;
    if (oldOrigin===undefined) delete process.env.GREENPLUS_GEOCODER_ORIGIN;
    else process.env.GREENPLUS_GEOCODER_ORIGIN=oldOrigin;
  }
});

test('Admin UI requires explicit location choice and APIs validate selected coordinates',()=>{
  const create=source('web-admin/src/app/api/stores/route.ts');
  const update=source('web-admin/src/app/api/stores/[storeId]/route.ts');
  const ui=source('web-admin/frontend/settings/StoreManagement.tsx');
  for(const route of [create,update]){
    assert.match(route,/resolveSelectedStoreAddress\(/);
    assert.match(route,/\{ latitude: body\.latitude, longitude: body\.longitude \}/);
    assert.doesNotMatch(route,/resolveDeliveryAddress\(/);
  }
  assert.match(ui,/locationCandidates\.map\(/);
  assert.match(ui,/onClick=\{\(\) => chooseStoreLocation\(geo\)\}/);
  assert.doesNotMatch(ui,/const geo = payload\.items\[0\]/);
  assert.match(ui,/setVerifiedAddress\(""\);/);
  const service=source('web-admin/backend/modules/stores/stores-management.service.ts');
  assert.match(service,/rejectConflictingStorePoint\(/);
  assert.match(service,/existingStores\.find\(/);

});

test('Shipper map binds to the verified delivery store and does not silently route from GPS',()=>{
  const svc=source('web-shipper/src/server/shipper-deliveries.ts');
  const panel=source('web-shipper/src/frontend/map/DeliveryMapPanel.tsx');
  const route=source('web-shipper/src/app/api/shipper/deliveries/[orderId]/demo-route/route.ts');
  assert.match(svc,/row\.orders\.store_id === row\.store_id/);
  assert.match(svc,/\.eq\("store_id", row\.store_id!\)/);
  assert.match(svc,/String\(store\.store_id\) !== row\.store_id/);
  assert.match(svc,/checkedStorePickup\(store, coordinateConflicts\)/);
  assert.match(panel,/routeOrigin === "gps" \? gps : pickup/);
  assert.match(panel,/useState<"gps" \| "store">\("store"\)/);
  assert.match(panel,/pickupWarning/);
  assert.match(route,/origin === "store" \? map\.pickup : payload\?\.start/);
  assert.match(route,/getShipperMapDetails\(user, orderId\)/);
});
