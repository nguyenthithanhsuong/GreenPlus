import test from 'node:test';
import assert from 'node:assert/strict';
import {BetterStackLogger} from '../../packages/supabase-shared/src/logger.ts';
test('telemetry removes contact numbers even when embedded in freeform text',async()=>{
 const before=globalThis.fetch;let payload;
 try{
  globalThis.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true};};
  const logger=new BetterStackLogger('fixture-key','https://logs.fixture.example/ingest');
  await logger.send({level:'critical',message:'User 0912345678 +84912345678 alice@example.com failed',context:{note:'Call 0912345678',nested:{phone:'+84912345678'},list:Array.from({length:150},(_,i)=>i)}});
  assert.doesNotMatch(JSON.stringify(payload),/0912345678|84912345678|alice@example.com/);
  assert.equal(payload.context.nested.phone,'[REDACTED]');
  assert.equal(payload.context.list.length,20);
 }finally{globalThis.fetch=before;}
});
test('telemetry caps untrusted context keys and nested object depth',async()=>{
 const before=globalThis.fetch;let data;
 try{
  globalThis.fetch=async(_url,options)=>{data=JSON.parse(options.body);return {ok:true};};
  const large={};for(let i=0;i<75;i++)large[`property_${i}`]='x'.repeat(1000);
  await new BetterStackLogger('fixture-key','https://logs.fixture.example/ingest').send({level:'error',message:'Test',context:large});
  assert.ok(Object.keys(data.context).length<=30);
  assert.ok(JSON.stringify(data.context).length<=16000);
 }finally{globalThis.fetch=before;}
});
test('actor IDs, customer IDs and JWT strings never leave telemetry unmasked',async()=>{
 const before=globalThis.fetch;let payload;
 try{
  globalThis.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true};};
  const token='eyJ'+'a'.repeat(25)+'.'+'b'.repeat(30)+'.'+'c'.repeat(30);
  await new BetterStackLogger('fixture-key','https://logs.fixture.example/ingest').send({level:'error',message:`Expired JWT ${token}`,context:{userId:'11111111-1111-4111-8111-111111111111',actorId:'sensitive',customerId:'sensitive2'}});
  assert.equal(payload.context.userId,'[REDACTED]');
  assert.equal(payload.context.actorId,'[REDACTED]');
  assert.equal(payload.context.customerId,'[REDACTED]');
  assert.doesNotMatch(JSON.stringify(payload),/eyJaaaaaaaa|11111111-1111/);
 }finally{globalThis.fetch=before;}
});
