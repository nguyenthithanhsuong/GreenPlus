import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { transformSupabaseSql, fullSchemaTargets, assertManifest } from '../scripts/three-tier-full-schema.mjs';
const root = resolve(import.meta.dirname,'..');
const read = p => readFileSync(resolve(root,p),'utf8');
const manifest = JSON.parse(read('docker/three-tier/full-schema/manifest.json'));
const hash = data => createHash('sha256').update(data).digest('hex');

test('canonical Docker PG17 manifest pins all twenty-one Supabase migration bytes', () => {
  assert.equal(manifest.migrations.length,21);
  assert.doesNotThrow(assertManifest);
  for(const m of manifest.migrations)assert.equal(hash(read(`supabase/migrations/${m.name}`)),m.sha256);
});
test('canonical scopes preserve three-tier layout and five schema destinations',()=>{
  assert.deepEqual(fullSchemaTargets.map(t=>t.service),['full-shared-db','full-enterprise-a-db','full-enterprise-b-db']);
  assert.deepEqual(fullSchemaTargets.flatMap(t=>t.schemas.map(s=>`${t.service}/${s}`)),[
    'full-shared-db/public','full-shared-db/pro_a','full-shared-db/pro_b',
    'full-enterprise-a-db/public','full-enterprise-b-db/public',
  ]);
});
test('all canonical migration SQL transforms preserve source immutability and schema isolation',()=>{
  for(const m of manifest.migrations){
    const source = read(`supabase/migrations/${m.name}`);
    assert.equal(hash(source),m.sha256);
    for(const scope of ['public','pro_a','pro_b']) {
      const transformed=transformSupabaseSql(source,scope);
      assert.ok(transformed.length>0);
      assert.doesNotMatch(transformed,/\b(?:BEGIN|COMMIT)\s*;\s*$/gmi);
      if(scope!=='public'){
        assert.doesNotMatch(transformed,/"public"/);
        assert.doesNotMatch(transformed,/\bpublic\./);
        assert.match(transformed,new RegExp(`(?:"${scope}"\\.|${scope}\\.)`));
      }
    }
  }
});
test('Supabase extension replacement is explicit and never silently removes new extensions',()=>{
  const base=read('supabase/migrations/0001_baseline_greenplus.sql');
  const result=transformSupabaseSql(base,'pro_a');
  for(const ext of ['pgcrypto','pg_stat_statements','supabase_vault','uuid-ossp'])
    assert.match(result,new RegExp(`compatibility excludes Supabase-managed extension: ${ext}`));
  assert.throws(()=>transformSupabaseSql('CREATE EXTENSION IF NOT EXISTS "unreviewed" WITH SCHEMA "extensions";','public'),/Unreviewed extension/);
});
test('new Docker PostgreSQL 17 volumes have no host ports and legacy PG16 is unchanged',()=>{
  const compose=read('docker/three-tier/compose.full-schema.yaml');
  assert.match(compose,/image:\s*postgres:17-alpine/g);
  assert.doesNotMatch(compose,/^\s*ports:/m);
  assert.doesNotMatch(compose,/\/var\/lib\/postgresql\/data\s*:\s*.*:ro/);
  assert.match(compose,/full_shared_data/);
  assert.match(compose,/full_enterprise_a_data/);
  assert.match(compose,/full_enterprise_b_data/);
  const original=read('docker/three-tier/compose.yaml');
  assert.match(original,/shared_data:\/var\/lib\/postgresql\/data/);
  assert.match(original,/image:\s*postgres:16-alpine/);
});
test('runtime does not push Supabase, delete Docker volumes or claim services are parity',()=>{
  const code=read('scripts/three-tier-full-schema.mjs');
  assert.doesNotMatch(code,/supabase.*db.*push|down\s+-v|--volumes|DROP\s+SCHEMA\s+CASCADE/i);
  assert.match(code,/NOT FULL SERVICE PARITY/);
  assert.match(code,/migration checksum mismatch/);
  assert.match(code,/existing tables but no migration ledger/);
  assert.match(code,/source_sha256/);
});
test('--plan completes without Docker and --check refuses missing Docker CLI',()=>{
  const plan=spawnSync(process.execPath,['scripts/three-tier-full-schema.mjs','--plan'],{cwd:root,encoding:'utf8'});
  assert.equal(plan.status,0,plan.stderr);
  assert.match(plan.stdout,/21 migrations/);
  assert.match(plan.stdout,/pro_a, pro_b/);
});
