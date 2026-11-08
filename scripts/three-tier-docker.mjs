/** Local-only Docker sandbox lifecycle. Never writes to Supabase or production. */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../docker/three-tier');
const envFile = resolve(root, '.env');
const command = process.argv[2] ?? 'help';
import { ensureDockerSecrets } from './three-tier-secrets.mjs';
import { connectLocalAdmin } from './three-tier-connect-admin.mjs';
import { assertPostgrestBootstrapConfig, redactPostgrestDiagnostics, POSTGREST_AUTH_SERVICES } from './three-tier-compose-auth.mjs';
function run(args, {capture = false} = {}) {
  // Docker Desktop on Windows/HDD hosts may exceed three minutes while building or waiting.
  const isStartup = args[0] === 'up';
  const timeout = isStartup ? 900000 : args[0] === 'exec' ? 180000 : 120000;
  const r = spawnSync('docker', ['compose', '--project-directory', root, ...args], {
    cwd: root, encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', timeout,
  });
  if (r.error) {
    if (r.error.code === 'ETIMEDOUT') {
      throw new Error(`docker compose ${args[0]} timed out after ${Math.round(timeout / 1000)}s. Containers may still be running; run npm run docker:three-tier:ps and npm run docker:three-tier:check before retrying.`);
    }
    if (r.error.code === 'ENOENT') throw new Error('Docker CLI not found. Install/start Docker Desktop and ensure docker is on PATH.');
    throw new Error(`docker compose ${args[0]} could not run: ${r.error.message}`);
  }
  if (r.status !== 0) throw new Error(`docker compose ${args[0]} exited with code ${r.status}${capture ? `: ${(r.stderr ?? '').trim()}` : ''}`);
  return r.stdout ?? '';
}
function init() {
  const { created, addedRestPassword } = ensureDockerSecrets(envFile);
  if (created) console.log('Created local Docker .env with generated secrets (not printed).');
  else if (addedRestPassword) console.log('Added separate PostgREST login secret to existing Docker .env; existing keys preserved.');
  else console.log('Existing local Docker .env preserved.');
}
// Validate the *resolved* Compose argv, not just YAML syntax. This catches an
// auth job whose `command: >-` gets split into separate arguments after sh -ec.
function verifyPostgrestBootstrapCommand() {
  const config = JSON.parse(run(['config', '--format', 'json'], {capture:true}));
  assertPostgrestBootstrapConfig(config);
}
function reportAuthBootstrapFailure() {
  try {
    const logs = run(['logs', '--no-color', '--tail', '50', ...POSTGREST_AUTH_SERVICES], {capture:true});
    const env = existsSync(envFile) ? readFileSync(envFile, 'utf8') : '';
    const safeLogs = redactPostgrestDiagnostics(logs, env).trim();
    if (safeLogs) console.error(`PostgREST bootstrap logs (secrets redacted):\n${safeLogs}`);
    else console.error('PostgREST bootstrap produced no logs. Inspect Docker Desktop and compose service status.');
  } catch (e) {
    console.error(`Could not inspect PostgREST bootstrap containers: ${e.message}`);
  }
  console.error('No Docker volumes were removed. Re-run npm run docker:three-tier:up after correcting the cause.');
}
function verifyPostgrestRole() {
  // Credential rotation happens in one-shot auth services BEFORE PostgREST starts.
  // Checking the role on every run prevents a false-green Docker dashboard.
  for (const [service, database] of [
    ['shared-db', 'greenplus_demo'], ['enterprise-a-db', 'enterprise_a'], ['enterprise-b-db', 'enterprise_b'],
  ]) {
    const query = "SELECT rolname || '|' || rolsuper || '|' || rolcanlogin || '|' || rolinherit || '|' || rolbypassrls || '|' || pg_has_role('greenplus_postgrest','web_anon','MEMBER') FROM pg_roles WHERE rolname='greenplus_postgrest'";
    const value = run(['exec','-T',service,'psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d',database,'-c',query], {capture:true}).trim();
    if (value !== 'greenplus_postgrest|false|true|false|false|true' && value !== 'greenplus_postgrest|f|t|f|f|t') {
      throw new Error(`PostgREST least-privilege role missing/incorrect in ${service}; check one-shot auth initialization. No volumes were touched.`);
    }
    console.log(`PASS ${service}: PostgREST login is non-superuser, NOINHERIT and member of web_anon`);
  }
}

async function ready() {
  const abort = AbortSignal.timeout(5000);
  const health = await fetch('http://127.0.0.1:4100/ready', {signal:abort});
  const payload = await health.json();
  if (!health.ok || payload.status !== 'ready') throw new Error(`Gateway/backends not ready: ${JSON.stringify(payload)}`);
  console.log('Gateway and all three PostgREST backends are ready.');
}
async function smoke() {
  await ready();
  if (!existsSync(envFile)) throw new Error('Missing docker/three-tier/.env');
  const key = /^DEMO_GATEWAY_KEY=(.+)$/m.exec(readFileSync(envFile,'utf8'))?.[1]?.trim();
  if (!key) throw new Error('Missing local gateway key');
  const res = await fetch('http://127.0.0.1:4100/stores', {headers:{'x-demo-gateway-key':key}, signal:AbortSignal.timeout(5000)});
  const payload = await res.json();
  if (!res.ok || !Array.isArray(payload.items) || payload.items.length < 2) throw new Error('Seeded store catalog unavailable');
  const store = payload.items.find(x=>x.tier==='regular');
  const product = await fetch(`http://127.0.0.1:4100/stores/${store.store_id}/products`, {headers:{'x-demo-gateway-key':key},signal:AbortSignal.timeout(5000)});
  const data = await product.json();
  if (!product.ok || !Array.isArray(data.products) || data.products.some(p=>p.store_id !== store.store_id)) throw new Error('Store product isolation smoke failed');
  console.log(`PASS: authenticated catalog (${payload.items.length} stores), Regular store-scoped product read (${data.products.length} rows).`);
  const denied = await fetch('http://127.0.0.1:4100/stores',{signal:AbortSignal.timeout(5000)});
  if (denied.status !== 401) throw new Error('Unauthenticated catalog must return HTTP 401');
  console.log('PASS: unauthorized request rejected.');
  // Non-destructive: inspect the actual commerce tables in the live container.
  for (const kind of ['inventory', 'orders']) {
    const inspected = await fetch(`http://127.0.0.1:4100/stores/${store.store_id}/${kind}`, {
      headers:{'x-demo-gateway-key':key},signal:AbortSignal.timeout(7000)});
    const result = await inspected.json();
    if (!inspected.ok || !Array.isArray(result.items) || result.items.some(x=>x.store_id !== store.store_id))
      throw new Error(`Tenant-isolated ${kind} inspection failed`);
    console.log(`PASS: ${kind} read (${result.items.length} records, store scoped).`);
  }

}
try {
  if (command==='init') init();
  else if (command==='up') {
    init(); run(['config','-q']); verifyPostgrestBootstrapCommand();
    try {
      run(['up','-d','--build','--wait','--wait-timeout','150']);
    } catch (error) {
      reportAuthBootstrapFailure();
      throw error;
    }
    // SQL init scripts only run on first database creation: rerun idempotent compatibility SQL for existing volumes.
    for (const [svc,db] of [['shared-db','greenplus_demo'],['enterprise-a-db','enterprise_a'],['enterprise-b-db','enterprise_b']]) {
      run(['exec','-T',svc,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d',db,'-f','/docker-entrypoint-initdb.d/002_product_category_slice.sql']);
    }
    // Apply and verify commerce migrations. A healthy container alone does NOT mean RPCs exist.
    const migration = spawnSync(process.execPath, [resolve(dirname(fileURLToPath(import.meta.url)), 'repair-three-tier-commerce.mjs')], {
      cwd: resolve(root, '../..'), encoding: 'utf8', stdio: 'inherit', timeout: 900000,
    });
    if (migration.error) throw new Error(`Commerce migration process failed: ${migration.error.message}`);
    if (migration.status !== 0) throw new Error('Commerce SQL migration/verification failed. See errors above; do not reset volumes.');
    verifyPostgrestRole();
    await smoke();
    // Prepare the NEXT workspace's actual env file; a root .env.local alone is
    // not read by web-admin. Never overwrite an intentionally configured remote.
    try {
      const linked = await connectLocalAdmin();
      console.log(linked.changed
        ? 'Admin Docker Local settings written safely to web-admin/.env.local. Restart Admin to load them.'
        : 'Admin Docker Local settings already match the authenticated gateway.');
    } catch (error) {
      console.warn(`Admin Docker switch is not linked: ${error.message}`);
      console.warn('Run npm run docker:three-tier:link-admin after resolving this; the Docker database itself remains ready.');
    }
    console.log('Docker sandbox ready. Admin gateway: http://127.0.0.1:4100 (local only).');
  }
  else if (command==='check') {
    run(['config','-q']); verifyPostgrestBootstrapCommand();
    const verification = spawnSync(process.execPath, [resolve(dirname(fileURLToPath(import.meta.url)), 'repair-three-tier-commerce.mjs'), '--check'], {
      cwd: resolve(root, '../..'), encoding:'utf8', stdio:'inherit', timeout: 180000,
    });
    if (verification.error || verification.status !== 0) throw new Error('Commerce RPC verification failed. Run node scripts/repair-three-tier-commerce.mjs to repair without deleting volumes.');
    verifyPostgrestRole();
    await smoke();
  }
  else if (command==='down') run(['down']);
  else if (command==='ps') run(['ps']);
  else { console.log('Usage: node scripts/three-tier-docker.mjs init|up|check|ps|down'); if(command !== 'help') process.exitCode=2; }
} catch(e) {console.error(e.message);process.exitCode=1;}
