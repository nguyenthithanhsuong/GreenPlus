import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORT_MESSAGES,supportMsg,normalizeSupportLocale} from '../packages/support-ui/MSG.mjs';

test('every Live Support message has Vietnamese and English translations',()=>{
  const vi=Object.keys(SUPPORT_MESSAGES.vi).sort();
  const en=Object.keys(SUPPORT_MESSAGES.en).sort();
  assert.deepEqual(vi,en);
  for(const key of vi){
    assert.ok(SUPPORT_MESSAGES.vi[key].trim().length>0,key);
    assert.ok(SUPPORT_MESSAGES.en[key].trim().length>0,key);
  }
  assert.equal(supportMsg('en','send'),'Send');
  assert.equal(supportMsg('vi','send'),'Gửi');
  assert.equal(normalizeSupportLocale('invalid'),'vi');
});
test('shared Live Support UI has proper locale storage and no sensitive data in storage',()=>{
  const code=readFileSync(new URL('../packages/support-ui/LiveSupportView.tsx',import.meta.url),'utf8');
  assert.match(code,/greenplus\.language\.v1/);
  assert.match(code,/useSyncExternalStore/);
  assert.match(code,/supportMsg\(locale,key\)/);
  assert.doesNotMatch(code,/localStorage\.setItem\([^\n]*(?:token|session|password)/i);
});
