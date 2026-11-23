import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pinnedMigrationSha256, originallyCrlfMigrations } from '../scripts/ci/pinned-migration-hash.mjs';
import { inventoryMigrations, verifyImmutableBaseline } from '../scripts/ci/migration-safety.mjs';
const root=resolve(import.meta.dirname,'..');
const lock=JSON.parse(readFileSync(resolve(root,'scripts/ci/supabase-migrations.lock.json'),'utf8')).immutable_migrations;
const manifest=JSON.parse(readFileSync(resolve(root,'docker/three-tier/full-schema/manifest.json'),'utf8'));

test('original historical SQL hashes remain pinned across Windows CRLF and Linux Git LF checkouts',()=>{
  assert.equal(originallyCrlfMigrations.length,9);
  for (const name of originallyCrlfMigrations) {
    const source=readFileSync(resolve(root,'supabase/migrations',name),'utf8');
    const asLinux=source.replace(/\r\n/g,'\n');
    assert.equal(pinnedMigrationSha256(name,source),lock[name]);
    assert.equal(pinnedMigrationSha256(name,asLinux),lock[name]);
    const changed=asLinux.replace(/([A-Za-z])/, '$1x');
    assert.notEqual(pinnedMigrationSha256(name,changed),lock[name]);
  }
});
test('migration lock and Docker manifest share the exact reviewed hashes (including 0023)',()=>{
  assert.equal(verifyImmutableBaseline(inventoryMigrations()),true);
  assert.equal(manifest.migrations.length,23);
  for(const row of manifest.migrations){
    const source=readFileSync(resolve(root,'supabase/migrations',row.name),'utf8');
    assert.equal(pinnedMigrationSha256(row.name,source),row.sha256);
    assert.equal(pinnedMigrationSha256(row.name,source.replace(/\r\n/g,'\n')),row.sha256);
  }
});
test('privileged AI RPC grants are corrected by NEW migration, not historical edits',()=>{
  const sql=readFileSync(resolve(root,'supabase/migrations/0023_restrict_privileged_ai_rpcs.sql'),'utf8');
  for (const name of ['ai_consume_quota','ai_decide_promotion','ai_create_manual_promotion']) {
    assert.match(sql,new RegExp(`REVOKE ALL ON FUNCTION public\\.${name}\\(`));
    assert.match(sql,new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${name}\\(`));
  }
  assert.match(sql,/FROM PUBLIC, anon, authenticated;/);
  assert.match(sql,/TO service_role;/);
  assert.match(sql,/MANUAL REVIEW REQUIRED/);
  const pgTap=readFileSync(resolve(root,'supabase/tests/database/002_tenant_security_contract.test.sql'),'utf8');
  assert.match(pgTap,/select plan\(12\);/);
  assert.match(pgTap,/ai_create_manual_promotion/);
});
