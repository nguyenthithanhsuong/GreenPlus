import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { classifySQL, inventoryMigrations, verifyImmutableBaseline, parseMigrationList, planRemoteMigrations } from '../scripts/ci/migration-safety.mjs';
const root=resolve(import.meta.dirname,'..');
const rows=inventoryMigrations();
const fakeList = (appliedCount) => `LOCAL         | REMOTE        | TIME (UTC)\n${rows.map((r,i)=>`${r.version} | ${i<appliedCount?r.version:''} | unknown`).join('\n')}`;

test('baseline source 0001-0021 is immutable by manifest, not by filenames alone',()=>{
 assert.equal(rows.length,21);
 assert.equal(verifyImmutableBaseline(rows),true);
 assert.throws(()=>verifyImmutableBaseline([{...rows[0],sha256:'f'.repeat(64)},...rows.slice(1)]),/Historical migration edited/);
 assert.throws(()=>verifyImmutableBaseline(rows.slice(1)),/Removed baseline/);
});
test('history parser accepts CLI ASCII and unicode delimiters',()=>{
 assert.deepEqual(parseMigrationList('LOCAL │ REMOTE │ UTC\n0001 │ 0001 │ date\n0002 │      │ date').map(x=>x.remote),['0001',null]);
 assert.deepEqual(parseMigrationList('LOCAL | REMOTE | UTC\n0001 | 0001 | date'),[{local:'0001',remote:'0001'}]);
 assert.throws(()=>parseMigrationList('Successfully deployed 0019'),/Unable to parse/);
});
test('no remote history, divergent history, and missing old revisions are blocked',()=>{
 assert.throws(()=>planRemoteMigrations(rows,fakeList(0)),/No remote baseline/);
 assert.throws(()=>planRemoteMigrations(rows,`LOCAL | REMOTE | UTC\n0001 | 0099 | date`),/diverges/);
 assert.throws(()=>planRemoteMigrations(rows,fakeList(18)),/manual deployment/);
 assert.throws(()=>planRemoteMigrations(rows,fakeList(19)),/manual deployment/);
 assert.deepEqual(planRemoteMigrations(rows,fakeList(21)),{applied:21,pending:[]});
});
test('auto-safe migrations allow only explicitly labeled nullable additive columns',()=>{
 const good='-- greenplus:autodeploy-safe\nBEGIN;\nALTER TABLE public.products ADD COLUMN IF NOT EXISTS extra_note text NULL;\nCOMMIT;';
 assert.equal(classifySQL(good).autoSafe,true);
 assert.equal(classifySQL(good.replace('-- greenplus:autodeploy-safe','-- any text')).autoSafe,false);
 assert.equal(classifySQL(good.replace(' text NULL',' text NOT NULL')).autoSafe,false);
 assert.equal(classifySQL(good.replace(' text NULL',' text DEFAULT now()')).autoSafe,false);
 assert.equal(classifySQL(good+'\nDROP TABLE public.products;').autoSafe,false);
 assert.equal(classifySQL('-- greenplus:autodeploy-safe\nDO $$BEGIN EXECUTE \'DROP TABLE users\'; END$$;').autoSafe,false);
 assert.equal(classifySQL('-- greenplus:autodeploy-safe\nALTER TABLE public.products DISABLE ROW LEVEL SECURITY;').autoSafe,false);
 assert.equal(classifySQL('-- greenplus:autodeploy-safe\nGRANT ALL ON public.users TO anon;').autoSafe,false);
 assert.equal(classifySQL('-- greenplus:autodeploy-safe\nUPDATE public.users SET status=\'active\';').autoSafe,false);
 assert.equal(classifySQL('-- greenplus:autodeploy-safe\nALTER TABLE public.products ADD COLUMN IF NOT EXISTS label text; -- DROP TABLE x').autoSafe,true);
});
test('SQL body quoted semicolons cannot masquerade as safe DDL',()=>{
 assert.equal(classifySQL('-- greenplus:autodeploy-safe\nALTER TABLE public.products ADD COLUMN IF NOT EXISTS x text;\nSELECT \';DROP TABLE users;\';').autoSafe,false);
 assert.equal(classifySQL('-- greenplus:autodeploy-safe\nALTER TABLE public.products ADD COLUMN IF NOT EXISTS x text; /* unterminated').autoSafe,false);
});
test('migration CI is gated after verified main, with no independent push deploy',()=>{
 const yaml=readFileSync(resolve(root,'.github/workflows/supabase-migrations-auto.yml'),'utf8');
 for(const s of ['workflow_run:','conclusion == \'success\'','head_repository.full_name == github.repository','supabase-production','GREENPLUS_SUPABASE_AUTODEPLOY','supabase-migration-gate.mjs --apply','persist-credentials: false'])assert.ok(yaml.includes(s),s);
 assert.ok(!/on:\s*\n\s*push:/m.test(yaml));
 const script=readFileSync(resolve(root,'scripts/ci/supabase-migration-gate.mjs'),'utf8');
 assert.ok(script.includes('db\',\'push\',\'--linked\',\'--dry-run'));
 assert.ok(!script.includes("'--include-all'"));
 assert.ok(!script.includes("'--include-seed'"));
});
test('storage and 3 tiers are recorded, no implied S3 in Postgres volumes',()=>{
 const storage=JSON.parse(readFileSync(resolve(root,'scripts/ci/storage-contract.json'),'utf8'));
 const tiers=JSON.parse(readFileSync(resolve(root,'scripts/ci/three-tier-contract.json'),'utf8'));
 assert.deepEqual(tiers.tiers.map(x=>x.tier),['regular','pro','enterprise']);
 assert.equal(tiers.productionCutoverAllowed,false);
 assert.equal(storage.docker.objectStorageImplemented,false);
 assert.deepEqual(storage.buckets.filter(x=>x.required).map(x=>x.name),['Product-Image','Category-Image','User_Images','Post-Attachment']);
});
