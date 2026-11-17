import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { planUnification, applyUnification, readAssignments } from '../scripts/unify-web-env.mjs';

const KEY = 'g'.repeat(64);
const STALE_KEY = 's'.repeat(64);
function fixture({rootKey=KEY,dockerKey=KEY, legacyKey=STALE_KEY} = {}) {
  const dir=mkdtempSync(resolve(tmpdir(),'greenplus-env-gateway-'));
  for (const app of ['web-admin', 'web-client', 'web-shipper']) mkdirSync(resolve(dir, app));
  mkdirSync(resolve(dir, 'docker/three-tier'), {recursive:true});
  if (rootKey !== null) writeFileSync(resolve(dir, '.env.local'), `GREENPLUS_DOCKER_GATEWAY_KEY=${rootKey}\nGREENPLUS_AI_SERVICE_URL=http://127.0.0.1:8100\n`);
  if (dockerKey !== null) writeFileSync(resolve(dir, 'docker/three-tier/.env'), `DEMO_GATEWAY_KEY=${dockerKey}\n`);
  writeFileSync(resolve(dir, 'web-admin/.env.local'), `GREENPLUS_DOCKER_GATEWAY_KEY=${legacyKey}\nAUTH_HANDOFF_SECRET=${'a'.repeat(64)}\n`);
  return dir;
}

test('a stale workspace gateway key is archived only when root matches Docker gateway', () => {
  const dir=fixture();
  try {
    const before=planUnification(dir);
    assert.deepEqual(before.conflicts, []);
    assert.deepEqual(before.obsoleteGatewayCopies, ['web-admin/.env.local']);
    assert.equal(readFileSync(resolve(dir,'.env.local'),'utf8').includes(KEY),true);
    assert.deepEqual(applyUnification(dir), {moved:1, added:1});
    const root=readAssignments(readFileSync(resolve(dir,'.env.local'),'utf8'),'.env.local');
    assert.equal(root.get('GREENPLUS_DOCKER_GATEWAY_KEY').value,KEY);
    assert.equal(root.get('AUTH_HANDOFF_SECRET').value,'a'.repeat(64));
    assert.equal(existsSync(resolve(dir,'web-admin/.env.local')),false);
    assert.match(readFileSync(resolve(dir,'web-admin/.env.local.greenplus-migrated.bak'),'utf8'),new RegExp(STALE_KEY));
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('if root gateway key does not match Docker, migration blocks without writing',()=>{
  const dir=fixture({dockerKey:'x'.repeat(64)});
  try {
    assert.deepEqual(planUnification(dir).conflicts,['GREENPLUS_DOCKER_GATEWAY_KEY']);
    assert.throws(()=>applyUnification(dir),/Conflicting key names/);
    assert.equal(existsSync(resolve(dir,'web-admin/.env.local')),true);
    assert.equal(existsSync(resolve(dir,'web-admin/.env.local.greenplus-migrated.bak')),false);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('missing Docker gateway source or root key never auto-resolves secret conflicts',()=>{
  for (const opt of [{dockerKey:null},{rootKey:null}]) {
    const dir=fixture(opt);
    try {
      const plan=planUnification(dir);
      if (opt.rootKey === null) {
        assert.equal(plan.added.includes('GREENPLUS_DOCKER_GATEWAY_KEY'),true);
      } else {
        assert.deepEqual(plan.conflicts,['GREENPLUS_DOCKER_GATEWAY_KEY']);
      }
      assert.deepEqual(plan.obsoleteGatewayCopies,[]);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  }
});

test('other conflicting secrets still block as before',()=>{
  const dir=fixture();
  try {
    writeFileSync(resolve(dir,'.env.local'), `GREENPLUS_DOCKER_GATEWAY_KEY=${KEY}\nAUTH_HANDOFF_SECRET=${'b'.repeat(64)}\n`);
    assert.deepEqual(planUnification(dir).conflicts,['AUTH_HANDOFF_SECRET']);
    assert.throws(()=>applyUnification(dir),/Conflicting key names/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
