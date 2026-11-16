/**
 * Additive Docker-only adaptation of Supabase migration 0019.
 * Applies SQL 005 to EXISTING volumes and verifies each of five storage scopes.
 * This does NOT configure Supabase authentication or enable production tenant routing.
 *
 * Usage:
 *   node scripts/repair-three-tier-parity.mjs             # apply + check
 *   node scripts/repair-three-tier-parity.mjs --check     # read-only verification
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../docker/three-tier');
const checkOnly = process.argv.includes('--check');
const targets = [
  {service: 'shared-db', db: 'greenplus_demo', folder: 'shared', schemas: ['public', 'pro_a', 'pro_b']},
  {service: 'enterprise-a-db', db: 'enterprise_a', folder: 'enterprise-a', schemas: ['public']},
  {service: 'enterprise-b-db', db: 'enterprise_b', folder: 'enterprise-b', schemas: ['public']},
];
const migration = '005_rbac_audit_promotions.sql';

function docker(args, capture = false) {
  const result = spawnSync('docker', ['compose', '--project-directory', root, ...args], {
    cwd: root, encoding: 'utf8', timeout: 180000, windowsHide: true,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error) throw new Error(`Docker command failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Docker command exited ${result.status}${capture ? `: ${(result.stderr ?? '').trim()}` : ''}`);
  return result.stdout ?? '';
}

function sqlIdentifier(name) {
  if (!['public', 'pro_a', 'pro_b'].includes(name)) throw new Error('Unexpected database schema');
  return name;
}

// One read-only query: every selected field must be present and accessible ONLY to
// privileged connections. A healthy container, by itself, is NOT proof of migration.
function verificationSQL(schema) {
  const s = sqlIdentifier(schema);
  const tableNames = ['roles', 'permissions', 'role_permissions', 'store_members',
    'platform_admins', 'audit_logs', 'promotions'];
  const tableChecks = tableNames.map(table => `to_regclass('${s}.${table}') IS NOT NULL`);
  const protectedTables = ['roles', 'permissions', 'role_permissions', 'store_members',
    'platform_admins', 'audit_logs', 'promotions'];
  return `SELECT CASE WHEN
    ${tableChecks.join(' AND\n    ')}
    AND EXISTS(SELECT 1 FROM public.demo_schema_migrations WHERE schema_name='${s}' AND migration='005_rbac_audit_promotions')
    AND (SELECT count(*) FROM ${s}.permissions) >= 58
    AND (SELECT count(*) FROM ${s}.roles WHERE lower(role_name) IN ('admin','manager','employee','customer','shipper')) >= 5
    AND EXISTS(SELECT 1 FROM ${s}.roles r JOIN ${s}.role_permissions rp USING(role_id)
      JOIN ${s}.permissions p ON p.id=rp.permission_id
      WHERE lower(r.role_name)='admin' AND p.key='audit.read_platform')
    AND EXISTS(SELECT 1 FROM ${s}.roles r JOIN ${s}.role_permissions rp USING(role_id)
      JOIN ${s}.permissions p ON p.id=rp.permission_id
      WHERE lower(r.role_name)='manager' AND p.key='audit.read')
    AND NOT EXISTS(SELECT 1 FROM ${s}.roles r JOIN ${s}.role_permissions rp USING(role_id)
      JOIN ${s}.permissions p ON p.id=rp.permission_id
      WHERE lower(r.role_name)='employee' AND p.key='audit.read')
    AND EXISTS(SELECT 1 FROM information_schema.columns
      WHERE table_schema='${s}' AND table_name='promotions' AND column_name='image_url')
    AND (SELECT count(*) FROM pg_trigger WHERE tgrelid='${s}.products'::regclass
      AND tgname='gp_audit_products' AND NOT tgisinternal) = 1
    AND (SELECT count(*) FROM pg_trigger WHERE tgrelid='${s}.inventory_stock'::regclass
      AND tgname='gp_audit_inventory_stock' AND NOT tgisinternal) = 1
    AND (SELECT count(*) FROM pg_trigger WHERE tgrelid='${s}.commerce_orders'::regclass
      AND tgname='gp_audit_commerce_orders' AND NOT tgisinternal) = 1
    AND (SELECT count(*) FROM pg_trigger WHERE tgrelid='${s}.promotions'::regclass
      AND tgname='gp_audit_promotions' AND NOT tgisinternal) = 1
    AND (SELECT count(*) FROM pg_class WHERE oid='${s}.audit_logs'::regclass AND relrowsecurity) = 1
    AND (SELECT count(*) FROM pg_class WHERE oid='${s}.promotions'::regclass AND relrowsecurity) = 1
    AND NOT (${protectedTables.map(table => `has_table_privilege('web_anon','${s}.${table}','SELECT')`).join(' OR ')})
    AND NOT has_table_privilege('web_anon','${s}.promotions','INSERT')
    AND NOT has_function_privilege('web_anon','${s}.greenplus_audit_business_change()','EXECUTE')
    THEN 'PASS' ELSE 'FAIL' END;`;
}

try {
  for (const target of targets) {
    if (!checkOnly) {
      const file = resolve(root, 'sql', target.folder, migration);
      if (!existsSync(file)) throw new Error(`Migration is missing: ${file}`);
      console.log(`Applying ${migration}: ${target.service}/${target.db}...`);
      docker(['exec', '-T', target.service, 'psql', '-X', '-v', 'ON_ERROR_STOP=1',
        '-U', 'postgres', '-d', target.db, '-f', `/docker-entrypoint-initdb.d/${migration}`]);
    }
    for (const schema of target.schemas) {
      const check = docker(['exec', '-T', target.service, 'psql', '-X', '-A', '-t',
        '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', target.db,
        '-c', verificationSQL(schema)], true).trim();
      if (check !== 'PASS') throw new Error(`${target.service}/${schema}: RBAC/audit/promotion parity verification failed (${check || 'no result'}). No volumes were deleted.`);
      console.log(`PASS ${target.service}/${schema}: 0019 registry, audit, promotion image, privileges and triggers`);
    }
  }
  console.log(checkOnly
    ? 'Five Docker scopes verified without database modifications.'
    : 'SQL 005 applied and verified in all five Docker scopes; no Supabase connection used.');
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  console.error('Inspect the SQL error and the existing volume state; do NOT run docker compose down -v.');
  process.exitCode = 1;
}
