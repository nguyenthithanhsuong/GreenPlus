import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validStreetAddress,validCoordinates,LocationError,geocodeAddress } from '../packages/location/index.mjs';
test('rejects empty, coarse, coordinate-only addresses', async () => {
  assert.equal(validStreetAddress(''),false);
  assert.equal(validStreetAddress('HCM'),false);
  assert.equal(validStreetAddress('10.8,106.7'),false);
  await assert.rejects(geocodeAddress('TP HCM'), LocationError);
});
test('coordinates restricted to Vietnam and finite', () => {
  assert.equal(validCoordinates(10.82,106.68),true);
  assert.equal(validCoordinates(NaN,106.68),false);
  assert.equal(validCoordinates(40,-73),false);
});
test('server geocoder chooses only street-level Vietnam points and caches result', async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (request, options) => {
    calls++;
    assert.equal(new URL(request).hostname, 'photon.komoot.io');
    assert.match(options.headers['User-Agent'],/GreenPlus/);
    return {ok:true,json:async()=>({features:[
      {geometry:{coordinates:[106.7,10.8]},properties:{name:'Ho Chi Minh City',countrycode:'VN'}},
      {geometry:{coordinates:[106.675,10.771]},properties:{street:'Nguyen Hue',housenumber:'12',city:'Ho Chi Minh City',countrycode:'VN'}},
      {geometry:{coordinates:[-73,40]},properties:{street:'Broadway',housenumber:'2',countrycode:'US'}}
    ]})};
  };
  try {
    const q = '12 Nguyen Hue, Ho Chi Minh City, Viet Nam';
    const one = await geocodeAddress(q);
    assert.equal(one.length,1);
    assert.equal(one[0].latitude,10.771);
    assert.equal(one[0].longitude,106.675);
    await geocodeAddress(q);
    assert.equal(calls,1);
  } finally {globalThis.fetch=previous;}
});
