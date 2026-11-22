import test from 'node:test';
import assert from 'node:assert/strict';
import {BetterStackLogger} from '../../packages/supabase-shared/src/logger.ts';
test('Better Stack sends sanitized error events without contact data, tokens or raw URLs',async()=>{
 const oldFetch=globalThis.fetch;const calls=[];
 try{
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true};};
  const logger=new BetterStackLogger('fixture-do-not-publish','https://logs.test.example/ingest');
  await logger.send({level:'error',message:'Failed for alice@example.com https://example.com/private?id=123',context:{email:'alice@example.com',authorization:'Bearer secret-123',address:'Home 42',nested:{api_key:'abcdef',note:'alice@example.com'}}});
  assert.equal(calls.length,1);
  const body=JSON.parse(calls[0].options.body);
  assert.equal(body.context.email,'[REDACTED]');
  assert.equal(body.context.authorization,'[REDACTED]');
  assert.equal(body.context.nested.api_key,'[REDACTED]');
  assert.doesNotMatch(JSON.stringify(body),/alice@example\.com|secret-123|\/private\?id=123/);
  assert.equal(calls[0].options.redirect,'error');
 }finally{globalThis.fetch=oldFetch;}
});
test('Better Stack rejects HTTP ingestion and skips sending anything if token absent',async()=>{
 const oldFetch=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;return {ok:true};};
  await new BetterStackLogger('token','http://logs.example.test').send({level:'critical',message:'fail'});
  await new BetterStackLogger('','https://logs.example.test').send({level:'critical',message:'fail'});
  assert.equal(calls,0);
 }finally{globalThis.fetch=oldFetch;}
});
