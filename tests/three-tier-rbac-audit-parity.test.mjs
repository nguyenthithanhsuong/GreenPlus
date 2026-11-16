import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = p => readFileSync(join(root,p),'utf8');
const source = read('supabase/migrations/0019_rbac_audit_foundation.sql');
const targets = ['shared','enterprise-a','enterprise-b'];
const sqls = Object.fromEntries(targets.map(x => [x, read(`docker/three-tier/sql/${x}/005_rbac_audit_promotions.sql`)]));
const runner = read('scripts/repair-three-tier-parity.mjs');
const wrapper = read('scripts/three-tier-docker.mjs');
const probe = read('scripts/test-three-tier-parity.mjs');
const permissionsFrom = sql => [...sql.matchAll(/INSERT INTO (?:public|pro_a|pro_b)\.permissions\(key,description\)\s*SELECT p\.key,p\.description FROM \(VALUES([\s\S]*?)\) AS p\(key,description\)/g)].flatMap(match=>[...match[1].matchAll(/\('([a-z][a-z0-9_.]+)','[^']*'\)/g)].map(x=>x[1]));

const dockerPreload = `
const cp = require('node:child_process');
const fs = require('node:fs');
const {syncBuiltinESMExports}=require('node:module');
const original = cp.spawnSync;
cp.spawnSync = function(command,args,options) {
  if(command !== 'docker') return original.call(this,command,args,options);
  fs.appendFileSync(process.env.GREENPLUS_TEST_DOCKER_TRACE,JSON.stringify(args)+'\\n');
  if(process.env.GREENPLUS_TEST_DOCKER_MODE === 'missing') return {status:0,stdout:'FAIL\\n',stderr:''};
  if(process.env.GREENPLUS_TEST_DOCKER_MODE === 'transport-error') return {status:54,stdout:'',stderr:'mock inaccessible database'};
  return {status:0,stdout:'PASS\\n',stderr:''};
};
syncBuiltinESMExports();
`;
function runMock(args, mode) {
  const dir=mkdtempSync(join(tmpdir(),'greenplus-parity-test-'));
  try {
    const preload=join(dir,'mock-docker.cjs');
    const trace=join(dir,'trace.jsonl');
    writeFileSync(preload,dockerPreload);writeFileSync(trace,'');
    const result=spawnSync(process.execPath,['--require',preload,join(root,'scripts/repair-three-tier-parity.mjs'),...args],{
      encoding:'utf8',timeout:15000,cwd:root,
      env:{...process.env,GREENPLUS_TEST_DOCKER_TRACE:trace,GREENPLUS_TEST_DOCKER_MODE:mode},
    });
    const commands=readFileSync(trace,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
    return {...result,commands};
  } finally {rmSync(dir,{recursive:true,force:true});}
}

test('SQL 005 replicates all 58 Supabase 0019 permission keys in each Docker tenant storage scope',()=>{
  const keys=[...source.split('SELECT p.key, p.description FROM (VALUES')[1].split(') AS p(key,description)')[0].matchAll(/\('([a-z][a-z0-9_.]+)','[^']*'\)/g)].map(x=>x[1]);
  assert.equal(keys.length,58);
  assert.equal(new Set(keys).size,58);
  for(const [folder,sql] of Object.entries(sqls)) {
    const scopes=folder==='shared'?3:1;
    assert.deepEqual(permissionsFrom(sql),Array.from({length:scopes},()=>keys).flat());
    assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.roles/);
    assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.audit_logs/);
    assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.promotions/);
    assert.match(sql,/image_url text/);
    assert.match(sql,/REFERENCES public\.products\(store_id,product_id\)/);
    assert.match(sql,/REVOKE ALL ON public\.roles,public\.permissions,public\.role_permissions/);
    assert.match(sql,/ALTER TABLE public\.audit_logs ENABLE ROW LEVEL SECURITY/);
    assert.match(sql,/ON CONFLICT DO NOTHING/);
    assert.match(sql,/COMMIT;\s*NOTIFY pgrst, 'reload schema'/);
    assert.doesNotMatch(sql,/\b(?:DROP\s+(?:DATABASE|TABLE|SCHEMA)|TRUNCATE\s+|DELETE\s+FROM)\b/i);
    for(const needle of ['gp_audit_products','gp_audit_inventory_stock','gp_audit_commerce_orders','gp_audit_promotions'])
      assert.ok(sql.includes(needle),`${folder} missing ${needle}`);
  }
  for(const name of ['pro_a','pro_b']) {
    assert.match(sqls.shared,new RegExp(`CREATE TABLE IF NOT EXISTS ${name}\\.roles`));
    assert.match(sqls.shared,new RegExp(`CREATE TABLE IF NOT EXISTS ${name}\\.audit_logs`));
  }
  assert.equal(sqls['enterprise-a'],sqls['enterprise-b'],'dedicated DB schemas must not drift');
});

test('Docker migration copies built-in role grants, does not log payment or user private fields',()=>{
  for(const sql of Object.values(sqls)) {
    for(const section of [
      "'greencreator.moderate','audit.read','audit.read_platform','system.manage','ai.use'",
      "'audit.read','ai.use','promotions.read','promotions.manage'",
      "'complaints.read','ai.use'",
    ]) assert.ok(sql.includes(section),`Missing Supabase role grant: ${section}`);
    assert.match(sql,/jsonb_strip_nulls\(jsonb_build_object/);
    assert.match(sql,/quantity_available/);
    assert.doesNotMatch(sql,/password_hash|access_token|payment_details|api_secret/i);
  }
});

test('Docker up applies 005 after 003/004, check verifies without migration',()=>{
  const iCommerce=wrapper.indexOf('repair-three-tier-commerce.mjs');
  const iParity=wrapper.indexOf('repair-three-tier-parity.mjs');
  assert.ok(iCommerce>=0 && iParity>iCommerce);
  assert.match(wrapper,/repair-three-tier-parity\.mjs'\), '--check'/);
  assert.match(runner,/has_table_privilege\('web_anon'/);
  assert.match(runner,/has_function_privilege\('web_anon'/);
  assert.match(probe,/ROLLBACK;/);
  assert.match(probe,/Cross-store promotion accepted/);
  assert.doesNotMatch(runner,/supabase\.co|SUPABASE_SERVICE_ROLE_KEY|docker\(\['down'|docker\(\['volume'/i);
});

test('read-only verification checks exactly five tenant scopes with no mutations',()=>{
  const result=runMock(['--check'],'ok');
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.commands.length,5);
  const names=result.commands.map(x=>x[x.indexOf('-d')+1]);
  assert.deepEqual(names,['greenplus_demo','greenplus_demo','greenplus_demo','enterprise_a','enterprise_b']);
  for(const args of result.commands){
    assert.ok(args.includes('psql'));
    assert.ok(!args.includes('-f'));
    const sql=args[args.indexOf('-c')+1];
    assert.match(sql,/^SELECT CASE WHEN/);
    assert.doesNotMatch(sql,/\b(?:INSERT\s+INTO|UPDATE\s+[^']|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE|CREATE\s+TABLE)\b/i);
  }
});

test('migration applies to three DBs and verifies five scopes, with volumes untouched',()=>{
  const result=runMock([],'ok');
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.commands.length,8,'3 SQL runs + 5 read-only queries');
  const files=result.commands.filter(args=>args.includes('-f')).map(args=>args[args.indexOf('-f')+1]);
  assert.deepEqual(files,Array(3).fill('/docker-entrypoint-initdb.d/005_rbac_audit_promotions.sql'));
  assert.equal(result.commands.filter(args=>args.includes('-c')).length,5);
  assert.ok(result.commands.every(args=>args.includes('exec')));
});

test('migration verification fails closed on missing schema and Docker errors',()=>{
  const missing=runMock(['--check'],'missing');
  assert.equal(missing.status,1);
  assert.match(missing.stderr,/RBAC\/audit\/promotion parity verification failed/);
  assert.equal(missing.commands.length,1);
  const failure=runMock(['--check'],'transport-error');
  assert.equal(failure.status,1);
  assert.match(failure.stderr,/exited 54/);
  assert.equal(failure.commands.length,1);
});
