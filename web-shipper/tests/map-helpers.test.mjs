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
