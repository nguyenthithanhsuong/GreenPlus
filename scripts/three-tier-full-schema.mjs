#!/usr/bin/env node
/**
 * Mirrors GreenPlus's canonical Supabase SQL migrations into isolated PostgreSQL
 * 17 Docker databases, preserving Regular(shared-public), Pro(shared schemas),
 * Enterprise(dedicated databases). Does not mutate older PostgreSQL-16 volumes.
 *
 * Intentional boundaries: application SQL DDL, constraints, SQL RPC, RLS/policies.
 * Supabase Auth / Storage / Realtime *services* are not implemented here.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dockerDir = resolve(root, 'docker/three-tier');
const migrationsDir = resolve(root, 'supabase/migrations');
const bootstrap = readFileSync(resolve(dockerDir, 'full-schema/bootstrap.sql'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(dockerDir, 'full-schema/manifest.json'), 'utf8'));
const compose = ['compose','--project-directory',dockerDir,'-f',resolve(dockerDir,'compose.yaml'),'-f',resolve(dockerDir,'compose.full-schema.yaml'),'--profile','full-schema'];
const targets = Object.freeze([
  { service:'full-shared-db', database:'greenplus_full_shared', schemas:['public','pro_a','pro_b'] },
  { service:'full-enterprise-a-db', database:'greenplus_full_enterprise_a', schemas:['public'] },
  { service:'full-enterprise-b-db', database:'greenplus_full_enterprise_b', schemas:['public'] },
]);
const escaped = s => `'${s.replaceAll("'", "''")}'`;
const quote = s => '"' + s.replaceAll('"', '""') + '"';
const sha = data => createHash('sha256').update(data).digest('hex');
const fileNames = readdirSync(migrationsDir).filter(f => /^\d{4}_[\w-]+\.sql$/.test(f)).sort();
const observed = fileNames.map(name => ({name, source: readFileSync(resolve(migrationsDir, name),'utf8')}));
const expectedTables = [...new Set(observed.flatMap(m => [...m.source.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.|public\.)(?:"([a-z_][a-z_0-9]*)"|([a-z_][a-z_0-9]*))/gi)].map(x=>x[1]||x[2])))].sort();
const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--plan') ? 'plan' : 'apply';

function assertManifest() {
  if (observed.length !== manifest.migrations.length) throw Error('New/deleted Supabase migration files: manual review and manifest regeneration are required. Auto-apply blocked.');
  for (const [i, m] of observed.entries()) {
    const expected = manifest.migrations[i];
    if (m.name !== expected.name || sha(m.source) !== expected.sha256) {
      throw Error(`Supabase migration history drift at ${m.name}: expected ${expected.name}/${expected.sha256}. Auto-apply blocked.`);
    }
  }
  if (observed.length !== 22 || fileNames[0] !== '0001_baseline_greenplus.sql' || !fileNames.at(-1).startsWith('0022_')) {
    throw Error('This release mirrors only 0001–0022; review new migrations and test DB behavior before deploying.');
  }
}

// EXACTLY four Supabase-managed extensions appear in 0001. They are excluded
// from stock PG17 because none are application requirements except uuid v4,
// which is implemented with a built-in PG generator in bootstrap.sql.
const unsupportedExtensions = ['pg_stat_statements','pgcrypto','supabase_vault','uuid-ossp'];
export function transformSupabaseSql(sql, schema) {
  if (!['public','pro_a','pro_b'].includes(schema)) throw Error('Invalid target schema');
  let result = sql.replace(/CREATE EXTENSION IF NOT EXISTS "([^"]+)" WITH SCHEMA "([^"]+)"\s*;/g,
    (statement, name) => {
      if (!unsupportedExtensions.includes(name)) throw Error(`Unreviewed extension: ${name}`);
      return `-- Docker PG17 compatibility excludes Supabase-managed extension: ${name}`;
    });
  // Migrations contain explicit BEGIN; and COMMIT; top-level lines. Transaction
  // boundaries are supplied by the runner so a migration + history write is atomic.
  result = result.replace(/^\s*(?:BEGIN|COMMIT)\s*;\s*$/gmi, '-- transaction controlled by Docker migration runner');
  if (schema !== 'public') {
    // Canonical SQL explicitly qualifies public tables, functions, triggers,
    // grants and references (including dynamic SQL inside PL/pgSQL bodies).
    result = result.replace(/"public"/g, quote(schema));
    result = result.replace(/\bpublic\./g, `${schema}.`);
    result = result.replace(/\bSET\s+search_path\s*=\s*public\b/gi, `SET search_path = ${schema}`);
  }
  if (schema !== 'public' && (/"public"/.test(result) || /\bpublic\./.test(result) || /\bSET\s+search_path\s*=\s*public\b/i.test(result))) {
    throw Error(`Unrewritten public schema reference in ${schema}`);
  }
  return result;
}

function docker(args, input = undefined, {capture=false, timeout=180000}={}) {
  const result = spawnSync('docker', [...compose, ...args], {
    cwd:dockerDir, encoding:'utf8', input, timeout, windowsHide:true,
    stdio: capture ? ['pipe','pipe','pipe'] : [input === undefined ? 'inherit':'pipe','inherit','inherit'],
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw Error(`Docker CLI failed: ${result.error.message}`);
  if (result.status !== 0) throw Error(`docker compose ${args[0]} failed (exit ${result.status}).${capture ? ` ${(result.stderr||'').slice(-1300)}`:''}`);
  return capture ? result.stdout.trim() : '';
}

function psql(t, sql, capture=false) {
  return docker(['exec','-T',t.service,'psql','-X','-q','-v','ON_ERROR_STOP=1','-U','postgres','-d',t.database],sql,{capture,timeout:240000});
}
function historySQL() { return `
CREATE SCHEMA IF NOT EXISTS greenplus_meta;
CREATE TABLE IF NOT EXISTS greenplus_meta.schema_migrations (
 scope text NOT NULL, migration text NOT NULL, source_sha256 text NOT NULL,
 applied_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(scope,migration)
);
REVOKE ALL ON SCHEMA greenplus_meta FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA greenplus_meta FROM PUBLIC, anon, authenticated;`;
}
function readScalar(t, expression) {
  const response = psql(t, `COPY (SELECT ${expression}) TO STDOUT;`, true);
  return response.trim();
}
function readHistory(t) {
  const exists = readScalar(t, `to_regclass('greenplus_meta.schema_migrations') IS NOT NULL`);
  if (exists !== 't') return [];
  const records = psql(t, `COPY (SELECT scope || '|' || migration || '|' || source_sha256 FROM greenplus_meta.schema_migrations ORDER BY scope,migration) TO STDOUT;`,true);
  return records.split(/\r?\n/).filter(line=>line.includes('|')).map(line => {
    const [scope,name,digest] = line.split('|'); return {scope,name,digest};
  });
}
function verifyHistory(history, t, requireComplete) {
  const allowed = new Set(t.schemas.flatMap(schema=>observed.map(m=>`${schema}|${m.name}`)));
  for(const row of history) {
    const key = `${row.scope}|${row.name}`;
    if (!allowed.has(key)) throw Error(`${t.service}: unknown applied migration ${key}. Stop; do not overwrite history.`);
    const expected = manifest.migrations.find(m=>m.name===row.name);
    if (row.digest !== expected.sha256) throw Error(`${t.service}: migration checksum mismatch at ${key}. Stop; inspect drift.`);
  }
  if (requireComplete && history.length !== allowed.size) {
    throw Error(`${t.service}: only ${history.length}/${allowed.size} migrations applied. Run npm run docker:three-tier:full-migrate.`);
  }
}
function verifyCanonicalObjects(t) {
  if (expectedTables.length !== 44) throw Error('Expected table inventory changed; update verifier deliberately.');
  for (const schema of t.schemas) {
    const expectedList=expectedTables.map(name=>escaped(name)).join(',');
    const sql = `SELECT CASE WHEN
      NOT EXISTS (SELECT 1 FROM unnest(ARRAY[${expectedList}]::text[]) t(name) WHERE to_regclass(${escaped(schema)} || '.' || t.name) IS NULL)
      AND (SELECT count(*) FROM information_schema.tables WHERE table_schema=${escaped(schema)} AND table_type='BASE TABLE') >= 44
      AND to_regclass(${escaped(`${schema}.users`)}) IS NOT NULL
      AND to_regclass(${escaped(`${schema}.orders`)}) IS NOT NULL
      AND to_regclass(${escaped(`${schema}.tenant_storage_registry`)}) IS NOT NULL
      AND to_regclass(${escaped(`${schema}.role_permissions`)}) IS NOT NULL
      AND to_regprocedure(${escaped(`${schema}.checkout_cart(uuid,uuid,text,text,numeric,text,text)`)}) IS NOT NULL
      AND EXISTS (SELECT 1 FROM pg_class WHERE oid=${escaped(`${schema}.users`)}::regclass AND relrowsecurity)
      THEN 'PASS' ELSE 'FAIL' END;`;
    const result = psql(t, sql, true);
    if (!/PASS/.test(result)) throw Error(`${t.service}/${schema}: canonical table/RLS/RPC verification failed.`);
    console.log(`PASS ${t.service}/${schema}: canonical SQL tables, RLS flag and checkout RPC`);
  }
}

async function main() {
  assertManifest();
  if (mode === 'plan') {
    console.log(`Canonical Supabase source: ${observed.length} migrations, immutable SHA-256 manifest verified.`);
    for(const t of targets)console.log(`${t.service}/${t.database}: ${t.schemas.join(', ')} × ${observed.length} migrations`);
    console.log('DDL-only compatibility: pgcrypto/vault/uuid-ossp/pg_stat_statements extension statements omitted; auth.uid() is deny-by-default; realtime broadcasts are NO-OP; Storage API not provided.');
    return;
  }
  // Strictly require local Docker; no remote connection strings are accepted.
  if (mode === 'apply') {
    docker(['config','-q']);
    docker(['up','-d','--wait','--wait-timeout','180',...targets.map(t=>t.service)],undefined,{timeout:900000});
  }
  for(const t of targets) {
    const major = Number(readScalar(t, "current_setting('server_version_num')::int"));
    if (!(major >= 170000 && major < 180000)) throw Error(`${t.service}: PostgreSQL 17 required; found ${major}. Existing PG16 databases must never be upgraded in place.`);
    if (mode === 'apply') {
      psql(t, bootstrap);
      psql(t, historySQL());
      // Publication is a PostgreSQL catalog object needed by baseline SQL;
      // it does not enable a Supabase Realtime server.
      psql(t, `DO $$BEGIN IF NOT EXISTS(SELECT FROM pg_publication WHERE pubname='supabase_realtime') THEN EXECUTE 'CREATE PUBLICATION supabase_realtime'; END IF; END$$;`);
    }
    const history = readHistory(t);
    verifyHistory(history,t,mode==='check');
    const applied = new Set(history.map(row=>`${row.scope}|${row.name}`));
    if(mode==='check') { verifyCanonicalObjects(t); continue; }
    for(const schema of t.schemas) {
      // A schema may already exist on repeated runs. Its ownership remains postgres.
      psql(t, `CREATE SCHEMA IF NOT EXISTS ${quote(schema)};`);
      if (!observed.some(m => applied.has(`${schema}|${m.name}`))) {
        const existing = Number(readScalar(t, `(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=${escaped(schema)} AND c.relkind IN ('r','p','v','m'))`));
        if (existing !== 0) throw Error(`${t.service}/${schema}: existing tables but no migration ledger. Do not overwrite an unknown schema; use a clean, dedicated full-schema volume or restore its history.`);
      }
      for(const m of observed) {
        const key=`${schema}|${m.name}`;
        if(applied.has(key))continue;
        const sourceHash = sha(m.source);
        const sql = transformSupabaseSql(m.source,schema);
        // Each migration + ledger write is one transaction, without replaying
        // previously applied SQL. If anything fails, this migration rolls back.
        const batch = `BEGIN;\n${sql}\nINSERT INTO greenplus_meta.schema_migrations(scope,migration,source_sha256) VALUES(${escaped(schema)},${escaped(m.name)},${escaped(sourceHash)});\nCOMMIT;`;
        console.log(`APPLY ${t.service}/${schema}: ${m.name}`);
        psql(t,batch);
        applied.add(key);
      }
    }
    verifyHistory(readHistory(t), t, true);
    verifyCanonicalObjects(t);
  }
  console.log('Canonical 0001–0021 SQL migrations applied/verified in all five new PG17 scopes. Legacy PG16 volumes unchanged.');
  console.log('NOT FULL SERVICE PARITY: Supabase Auth, Realtime, Storage and application API routing remain separate. Do not cut over production.');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e => {console.error(`BLOCKED: ${e.message}`); process.exitCode=1;});
}
export const fullSchemaTargets = targets;
export { assertManifest, main as runFullSchemaMigrations };
