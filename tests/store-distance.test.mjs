import {test} from 'node:test';
import assert from 'node:assert/strict';
import {distanceKm,nearestStore} from '../web-client/src/lib/stores/store-selection.ts';
const stores=[
 {store_id:'a',name:'near',latitude:10.85,longitude:106.77},
 {store_id:'b',name:'far',latitude:21.03,longitude:105.85},
];
test('nearest available store is selected by straight-line distance',()=>{
 assert.equal(nearestStore(stores,{latitude:10.84,longitude:106.76})?.store.store_id,'a');
 assert.equal(distanceKm({latitude:10.84,longitude:106.76},stores[1])>900,true);
});
test('stores without coordinates are not recommended',()=>{
 assert.equal(nearestStore([{store_id:'x',latitude:null,longitude:null}],{latitude:10,longitude:100}),null);
});
