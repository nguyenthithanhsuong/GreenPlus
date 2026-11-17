/** Local dev workflow: read-only Supabase checks, reconcile Docker sandbox, verify and launch 3 web apps.
 * `npm run dev:all` & `npm run dev` use this flow; `npm run web` bypasses Docker.
 * No remote Supabase SQL push, PostgreSQL major upgrade, volume reset or production cutover.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectLocalAdmin } from './three-tier-connect-admin.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');


// Fail before any Docker mutation if an incremental ZIP was applied without its
// required companion files. This catches the 17 Nov split-patch regression.
const requiredDevAllFiles = [
  'scripts/ci/dev-supabase-compatibility.mjs',
  'scripts/ci/supabase-migration-gate.mjs',
  'scripts/ci/migration-safety.mjs',
  'scripts/ci/supabase-migrations.lock.json',
  'scripts/ci/check-storage.mjs',
  'scripts/ci/storage-contract.json',
  'scripts/ci/three-tier-contract.json',
  'scripts/ci/three-tier-parity-audit.mjs',
  'scripts/ci/three-tier-store-inventory.mjs',
  'scripts/three-tier-docker.mjs',
  'scripts/three-tier-full-schema.mjs',
  'scripts/repair-three-tier-parity.mjs',
  'scripts/repair-three-tier-commerce.mjs',
  'scripts/three-tier-connect-admin.mjs',
  'docker/three-tier/compose.yaml',
  'docker/three-tier/compose.full-schema.yaml',
  'docker/three-tier/full-schema/bootstrap.sql',
  'docker/three-tier/full-schema/manifest.json',
  'docker/three-tier/sql/shared/005_rbac_audit_promotions.sql',
  'docker/three-tier/sql/enterprise-a/005_rbac_audit_promotions.sql',
  'docker/three-tier/sql/enterprise-b/005_rbac_audit_promotions.sql',
  'supabase/config.toml',
  'web-admin/src/app/api/storage/signed-upload/route.ts',
];

export function assertDevAllFiles() {
  const missing = requiredDevAllFiles.filter(relative => !existsSync(resolve(projectRoot, relative)));
  const manifest = resolve(projectRoot, 'docker/three-tier/full-schema/manifest.json');
  if (existsSync(manifest)) {
    try {
      const migrations = JSON.parse(readFileSync(manifest, 'utf8')).migrations;
      if (!Array.isArray(migrations) || migrations.length !== 21) throw Error('expected 21 migrations');
      for (const item of migrations) {
        if (typeof item.name !== 'string' || !/^\d{4}_[\w-]+\.sql$/.test(item.name)) throw Error('invalid migration file name');
        const filename = `supabase/migrations/${item.name}`;
        if (!existsSync(resolve(projectRoot, filename))) missing.push(filename);
      }
    } catch (error) {
      throw Error(`Invalid Docker migration manifest: ${error.message}. Restore the complete GreenPlus recovery patch.`);
    }
  }
  if (missing.length) {
    throw Error(`Incomplete GreenPlus migration patch; missing ${missing.length} required file(s):\n - ${missing.join('\n - ')}\nApply the consolidated DevAll recovery patch in the project root before retrying.`);
  }
  return requiredDevAllFiles.length + 21;
}

export function devAllSteps({ dockerUpdate = true, requireParity = false } = {}) {
  return [
    { script: 'scripts/ci/dev-supabase-compatibility.mjs', args: [] },
    { script: 'scripts/three-tier-docker.mjs', args: [dockerUpdate ? 'up' : 'check'] },
    ...(dockerUpdate ? [] : [{ script: 'scripts/three-tier-full-schema.mjs', args: ['--check'] }]),
    ...(dockerUpdate ? [{ script: 'scripts/three-tier-docker.mjs', args: ['check'] }] : []),
    { script: 'scripts/ci/three-tier-parity-audit.mjs', args: requireParity ? ['--require-full-parity'] : [] },
    { script: 'scripts/ci/three-tier-store-inventory.mjs', args: [] },
  ];
}

function runStep({ script, args }, index, total) {
  console.log(`[GreenPlus] Preflight ${index + 1}/${total}: ${script} ${args.join(' ')}`);
  if (script === 'scripts/three-tier-docker.mjs' || script === 'scripts/three-tier-full-schema.mjs') {
    // Check before Docker bootstrap generates any local secrets or changes volumes.
    const docker = spawnSync('docker', ['version'], { cwd: projectRoot, encoding: 'utf8', timeout: 30000, windowsHide: true });
    if (docker.error || docker.status !== 0)
      throw Error('Docker Desktop/CLI is not ready. Start Docker Desktop and retry; no Docker migration was attempted.');
  }
  const timeout = (script === 'scripts/three-tier-docker.mjs' && args[0] === 'up') || (script === 'scripts/three-tier-full-schema.mjs' && !args.includes('--check')) ? 1500000 : 240000;
  const result = spawnSync(process.execPath, [resolve(projectRoot, script), ...args], {
    cwd: projectRoot, stdio: 'inherit', timeout, windowsHide: true,
  });
  if (result.error || result.status !== 0)
    throw Error(`${script} ${args.join(' ')} failed: ${result.error?.message || `exit ${result.status}`}. No Docker volumes were removed.`);
}

async function main() {
  if (process.env.CI === 'true' || process.env.NODE_ENV === 'production')
    throw Error('dev:all is local-only; it must not run in CI or production.');
  assertDevAllFiles();
  const steps = devAllSteps({
    dockerUpdate: process.env.GREENPLUS_DEV_DOCKER_UPDATE !== 'false',
    requireParity: process.env.GREENPLUS_DEV_REQUIRE_FULL_PARITY === 'true',
  });
  for (const [index, step] of steps.entries()) runStep(step, index, steps.length);
  // The actual Next.js workspace env must be linked; never overwrite an explicit remote target.
  const linked = await connectLocalAdmin();
  console.log(`[GreenPlus] Admin ↔ Docker Local: ${linked.changed ? 'configured' : 'ready'}.`);
  console.log('[GreenPlus] Docker sandbox up-to-date and verified. Supabase read-only audit above; full production parity is NOT assumed.');
  console.log('[GreenPlus] Starting Admin, Client and Shipper through Turbo...');
  const child = spawn('npm run web', {
    cwd: projectRoot, stdio: 'inherit', shell: true, env: process.env,
  });
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (stopping) return;
      stopping = true;
      if (process.platform !== 'win32') child.kill(signal);
    });
  }
  child.on('error', error => { console.error(`[GreenPlus] Cannot start web apps: ${error.message}`); process.exitCode = 1; });
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 130 : 1); });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`[GreenPlus] BLOCKED: ${error.message}`);
    console.error('[GreenPlus] For web-only development: npm run web (does not update/check Docker).');
    process.exitCode = 1;
  });
}
