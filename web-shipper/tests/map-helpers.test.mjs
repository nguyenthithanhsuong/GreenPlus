import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validPoint,haversineKm,convertOsrmResponse} from '../src/lib/map-helpers.mjs';

const point={lat:10.82,lng:106.63};
test('coordinate validator rejects malformed and out of range positions',()=>{
  assert.equal(validPoint(point),true);
  for(const invalid of [null,undefined,{}, {lat:'10.82',lng:106.63},{lat:NaN,lng:1},{lat:91,lng:2},{lat:0,lng:181}])
    assert.equal(validPoint(invalid),false);
});
test('haversine distance is zero at the same point, symmetric and never a travel route',()=>{
  const another={lat:10.78,lng:106.70};
  assert.equal(haversineKm(point,point),0);
  assert.ok(Math.abs(haversineKm(point,another)-haversineKm(another,point))<1e-9);
  assert.ok(haversineKm(point,another)>0);
  assert.equal(haversineKm(point,null),null);
});
test('routing data requires valid OSRM geometry and travel units',()=>{
  const good={code:'Ok',routes:[{distance:5700,duration:530,geometry:{coordinates:[[106.63,10.82],[106.70,10.78]]}}]};
  assert.deepEqual(convertOsrmResponse(good),{points:[point,{lat:10.78,lng:106.70}],distanceMeters:5700,durationSeconds:530});
  assert.equal(convertOsrmResponse({...good,code:'NoRoute'}),null);
  assert.equal(convertOsrmResponse({code:'Ok',routes:[{distance:1,duration:1,geometry:{coordinates:[[999,99],[1,1]]}}]}),null);
  assert.equal(convertOsrmResponse({code:'Ok',routes:[{distance:NaN,duration:1,geometry:{coordinates:[[1,1],[2,2]]}}]}),null);
});
test('map routes authorize the assigned shipper, not the supplied store_id',()=>{
  const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
  const map=read('../src/app/api/shipper/deliveries/[orderId]/map/route.ts');
  const demo=read('../src/app/api/shipper/deliveries/[orderId]/demo-route/route.ts');
  const service=read('../src/server/shipper-deliveries.ts');
  for(const source of [map,demo]){
    assert.match(source,/requireShipper/);
    assert.match(source,/getShipperMapDetails/);
    assert.doesNotMatch(source,/localhost:3001|GREENPLUS_SHIPPER_API_BASE_URL/);
  }
  assert.match(service,/\.eq\('employee_id', user\.user_id\)/);
  assert.match(service,/stores\.has\(row\.store_id!\)/);
  assert.match(service,/scoped\(row\)/);
  assert.match(demo,/process\.env\.NODE_ENV !== 'development'/);
  assert.match(demo,/get\('origin'\)/);
});
test('Web dashboard opens map inside Shipper, not external Google Maps',()=>{
  const src=readFileSync(new URL('../src/frontend/dashboard/Dashboard.tsx',import.meta.url),'utf8');
  assert.match(src,/DeliveryMapPanel/);
  assert.match(src,/setMapOrder\(item\.order_id\)/);
  assert.doesNotMatch(src,/google\.com\/maps\/search/);
});

test('database coordinates: preserve 0012 numeric values, never invent a missing destination', async () => {
  const {databasePoint} = await import('../src/lib/map-helpers.mjs');
  assert.deepEqual(databasePoint('10.8512451', '106.7549023'), {lat: 10.8512451, lng: 106.7549023});
  assert.deepEqual(databasePoint(10.8512451, 106.7549023), {lat: 10.8512451, lng: 106.7549023});
  assert.equal(databasePoint(null, null), null);
  assert.equal(databasePoint('', '106.75'), null);
  assert.equal(databasePoint('not a number', '106.75'), null);
  assert.equal(databasePoint('91', '106.75'), null);
});

test('map fetch reads actual order coordinates and never draws a fake straight-line route', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const service = read('../src/server/shipper-deliveries.ts');
  const map = read('../src/frontend/map/MapCanvas.tsx');
  const panel = read('../src/frontend/map/DeliveryMapPanel.tsx');
  assert.match(service, /orders\(delivery_address,delivery_latitude,delivery_longitude,total_amount,store_id,users\(name\)\)/);
  assert.match(service, /const dropoff = databasePoint\(row\.orders\?\.delivery_latitude, row\.orders\?\.delivery_longitude\)/);
  assert.match(service, /\.eq\('employee_id', user\.user_id\)/);
  assert.match(map, /road && road\.length > 1 && <Polyline/);
  assert.doesNotMatch(map, /:pickup&&dropoff\?<Polyline/);
  assert.match(panel, /setDropoff\(validPoint\(body\.dropoff\)/);
  assert.match(panel, /Chưa tính tuyến đường/);
});


test('external navigation URL uses valid destination coordinates only', async () => {
  const {googleMapsNavigationUrl} = await import('../src/lib/map-helpers.mjs');
  assert.equal(googleMapsNavigationUrl(null), null);
  assert.equal(googleMapsNavigationUrl({lat: 999, lng: 106}), null);
  const href = googleMapsNavigationUrl({lat: 10.82, lng: 106.63});
  const url = new URL(href);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('destination'), '10.82,106.63');
  assert.equal(url.searchParams.get('travelmode'), 'driving');
});
