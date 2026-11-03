/** Local-only Docker sandbox lifecycle. Never writes to Supabase or production. */
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../docker/three-tier');
const envFile = resolve(root, '.env');
const command = process.argv[2] ?? 'help';
const token = () => randomBytes(36).toString('hex');
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
  if (existsSync(envFile)) {
    const content = readFileSync(envFile, 'utf8');
    if (/replace-with-|^\s*(DEMO_POSTGRES_PASSWORD|DEMO_GATEWAY_KEY)\s*=\s*$/m.test(content)) throw new Error('Existing docker/three-tier/.env contains placeholder or empty secrets; replace them manually.');
    console.log('Existing local Docker .env preserved.');
    return;
  }
  writeFileSync(envFile, `# Generated for local Docker sandbox only. Do not commit.\nDEMO_POSTGRES_PASSWORD=${token()}\nDEMO_GATEWAY_KEY=${token()}\n`, {mode:0o600, flag:'wx'});
  console.log('Created docker/three-tier/.env with random secrets (not printed).');
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
    init(); run(['config','-q']); run(['up','-d','--build','--wait','--wait-timeout','150']);
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
    await smoke();
    console.log('Docker sandbox ready. Admin gateway: http://127.0.0.1:4100 (local only).');
  }
  else if (command==='check') {
    run(['config','-q']);
    const verification = spawnSync(process.execPath, [resolve(dirname(fileURLToPath(import.meta.url)), 'repair-three-tier-commerce.mjs'), '--check'], {
      cwd: resolve(root, '../..'), encoding:'utf8', stdio:'inherit', timeout: 180000,
    });
    if (verification.error || verification.status !== 0) throw new Error('Commerce RPC verification failed. Run node scripts/repair-three-tier-commerce.mjs to repair without deleting volumes.');
    await smoke();
  }
  else if (command==='down') run(['down']);
  else if (command==='ps') run(['ps']);
  else { console.log('Usage: node scripts/three-tier-docker.mjs init|up|check|ps|down'); if(command !== 'help') process.exitCode=2; }
} catch(e) {console.error(e.message);process.exitCode=1;}
