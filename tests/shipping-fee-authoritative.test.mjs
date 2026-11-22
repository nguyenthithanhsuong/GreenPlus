import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeShippingConfig,quoteShipping,distanceKm} from '../packages/location/shipping-fee.mjs';
test('shipping fee is computed on server and never provided by browser',()=>{
 const store={latitude:10.8,longitude:106.7}, to={latitude:10.81,longitude:106.71};
 const fee=quoteShipping(null,store,to);
 assert.equal(fee.currency,'VND');assert.ok(fee.fee>=15000);assert.ok(fee.distance_km>0);
 assert.equal(quoteShipping(null,null,to).fee,15000);
});
test('store fee configuration validation, zero discount and distance bounds',()=>{
 assert.throws(()=>normalizeShippingConfig({per_km:-1},{strict:true}));
 assert.throws(()=>normalizeShippingConfig({unexpected:'x'},{strict:true}));
 assert.equal(quoteShipping({free_from:50000},null,null,{cartSubtotal:50000}).fee,0);
 assert.throws(()=>quoteShipping({max_radius_km:1},{latitude:10.8,longitude:106.7},{latitude:11.2,longitude:107.1}));
 assert.equal(distanceKm(null,null),null);
});
