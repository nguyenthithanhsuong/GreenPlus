import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('..', import.meta.url)));
const repair=readFileSync(join(root,'scripts/repair-three-tier-commerce.mjs'),'utf8');
const wrapper=readFileSync(join(root,'scripts/three-tier-docker.mjs'),'utf8');

test('repair runs 003 before 004 on all 3 databases, checks five scopes, and never touches volume data',()=>{
  assert.match(repair,/\['003_inventory_orders\.sql','004_payment_delivery_simulation\.sql'\]/);
  for(const item of ['shared-db','enterprise-a-db','enterprise-b-db','pro_a','pro_b']) assert.ok(repair.includes(item));
  for(const item of ['demo_restock','demo_checkout','demo_cancel_order','demo_confirm_payment','demo_assign_delivery','demo_complete_delivery']) assert.ok(repair.includes(item));
  assert.doesNotMatch(repair,/\b(?:down\s+-v|volume\s+rm|DROP\s+(?:TABLE|SCHEMA|DATABASE))\b/i);
});
test('docker up verifies after SQL while docker check remains non-mutating',()=>{
  assert.match(wrapper,/repair-three-tier-commerce\.mjs'\)\]/);
  assert.match(wrapper,/repair-three-tier-commerce\.mjs'\), '--check'/);
  assert.match(wrapper,/if \(migration\.status !== 0\) throw/);
});
test('read-only verification fails with exact missing signatures',()=>{
  const dir=mkdtempSync(join(tmpdir(),'greenplus-repair-'));
  try {
    mkdirSync(join(dir,'scripts'),{recursive:true});
    mkdirSync(join(dir,'docker/three-tier'),{recursive:true});
    mkdirSync(join(dir,'bin'),{recursive:true});
    cpSync(join(root,'scripts/repair-three-tier-commerce.mjs'),join(dir,'scripts/repair-three-tier-commerce.mjs'));
    writeFileSync(join(dir,'package.json'),'{"type":"module"}');
    const docker=join(dir,'bin/docker');
    writeFileSync(docker, '#!/bin/sh\necho "public.demo_restock(uuid,uuid,integer)"\n');
    chmodSync(docker,0o755);
    const result=spawnSync(process.execPath,[join(dir,'scripts/repair-three-tier-commerce.mjs'),'--check'],{env:{...process.env,PATH:join(dir,'bin')+':'+process.env.PATH},encoding:'utf8'});
    assert.equal(result.status,1);
    assert.match(result.stderr,/missing RPCs: public\.demo_restock/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
