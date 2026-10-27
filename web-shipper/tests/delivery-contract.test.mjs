import test from 'node:test';import assert from 'node:assert/strict';
import {allowedTransition,normalizeDelivery,safeOrderId} from '../src/lib/delivery-contract.mjs';
test('only adjacent transitions are valid',()=>{assert.equal(allowedTransition('assigned','picked_up'),true);assert.equal(allowedTransition('assigned','delivered'),false);assert.equal(allowedTransition('delivered','assigned'),false);});
test('reject invalid status and unsafe order identifiers',()=>{assert.throws(()=>normalizeDelivery({order_id:'a',status:'bogus'}));assert.equal(safeOrderId('../secrets'),false);});
test('normalize upstream delivery without exposing extra fields',()=>{const result=normalizeDelivery({order_id:'1',status:'assigned',secret:'hidden',total_amount:'200'});assert.equal(result.total_amount,200);assert.equal('secret' in result,false);});
