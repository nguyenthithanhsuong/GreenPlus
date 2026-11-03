/** GreenPlus local Docker lab: apply existing idempotent commerce SQL and verify all RPCs.
 * Never connects to Supabase. Does not delete volumes or replace .env secrets.
 * Usage: node scripts/repair-three-tier-commerce.mjs [--check]
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../docker/three-tier');
const checkOnly = process.argv.includes('--check');
const targets = [
  { service: 'shared-db', db: 'greenplus_demo', folder: 'shared', schemas: ['public','pro_a','pro_b'] },
  { service: 'enterprise-a-db', db: 'enterprise_a', folder: 'enterprise-a', schemas: ['public'] },
  { service: 'enterprise-b-db', db: 'enterprise_b', folder: 'enterprise-b', schemas: ['public'] },
];
const required = [
  'demo_restock(uuid,uuid,integer)',
  'demo_checkout(uuid,uuid,jsonb)',
  'demo_cancel_order(uuid,uuid)',
  'demo_confirm_payment(uuid,uuid)',
  'demo_assign_delivery(uuid,uuid,text)',
  'demo_complete_delivery(uuid,uuid)',
];
function docker(args, options = {}) {
  const p = spawnSync('docker', ['compose', '--project-directory',root, ...args], {
    cwd: root, encoding: 'utf8', stdio: options.capture ? ['ignore','pipe','pipe'] : 'inherit',
    timeout: 180000, windowsHide: true,
  });
  if (p.error) {
    if (p.error.code === 'ETIMEDOUT') throw new Error(`Docker command timed out (${args.slice(0,3).join(' ')}). Containers may still be running.`);
    throw new Error(`Docker command failed to start: ${p.error.message}`);
  }
  if (p.status !== 0) throw new Error(`Docker command failed (exit ${p.status}): ${args.slice(0,4).join(' ')}${options.capture ? '\n'+(p.stderr||'').trim() : ''}`);
  return p.stdout || '';
}
function sqlName(schema, fn) { return `${schema}.${fn}`; }
function check(target) {
  for (const schema of target.schemas) {
    const expressions = required.map(fn => `('${sqlName(schema,fn)}', to_regprocedure('${sqlName(schema,fn)}') IS NOT NULL)`);
    const sql = `SELECT signature FROM (VALUES ${expressions.join(',')}) AS required(signature, present) WHERE NOT present;`;
    const result = docker(['exec','-T',target.service,'psql','-X','-A','-t','-v','ON_ERROR_STOP=1','-U','postgres','-d',target.db,'-c',sql],{capture:true});
    const missing = result.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if (missing.length) throw new Error(`${target.service}/${schema}: missing RPCs: ${missing.join(', ')}`);
    console.log(`PASS ${target.service}/${schema}: ${required.length} commerce RPC signatures present`);
  }
}
try {
  for (const t of targets) {
    if (!checkOnly) {
      for (const migration of ['003_inventory_orders.sql','004_payment_delivery_simulation.sql']) {
        const local = resolve(root,'sql',t.folder,migration);
        if (!existsSync(local)) throw new Error(`Missing SQL file: ${local}. Restore the Phase 6 / lifecycle patch before running repair.`);
        console.log(`Applying ${migration} to ${t.service} (${t.db})...`);
        docker(['exec','-T',t.service,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d',t.db,'-f',`/docker-entrypoint-initdb.d/${migration}`]);
      }
      docker(['exec','-T',t.service,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d',t.db,'-c',"NOTIFY pgrst, 'reload schema';"]);
    }
    check(t);
  }
  console.log(checkOnly ? 'All required commerce RPCs exist across five tenant storage scopes.' : 'Commerce migration and verification complete. No Docker volumes were removed.');
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  console.error('This is a migration or configuration failure, NOT a signal to delete volumes.');
  process.exitCode = 1;
}
