/** Optional local full WEB stack using an internal Docker bridge for Admin.
 * Client/Shipper intentionally retain their Supabase production integrations.
 * No volume deletion, DB reset, network publishing, or secret printing.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { localDockerSettings } from './three-tier-connect-admin.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const action = process.argv[2] ?? 'help';
const composeArgs = ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.three-tier.yml'];
const secretFile = resolve(root, 'docker/three-tier/.env');

function run(command, args, env, timeout = 900000) {
  const result = spawnSync(command, args, {
    cwd: root, stdio: 'inherit', timeout, windowsHide: true,
    env: { ...process.env, ...env },
  });
  if (result.error) throw new Error(result.error.code === 'ETIMEDOUT' ? 'Docker timed out; inspect running containers before retrying.' : 'Cannot run Docker. Check Docker Desktop and CLI.');
  if (result.status !== 0) throw new Error(`Docker command failed (exit ${result.status}); no volumes were removed.`);
}
function bridgeEnv() {
  if (!existsSync(secretFile)) throw new Error('Missing Docker sandbox .env. Run npm run docker:three-tier:init.');
  const settings = localDockerSettings(readFileSync(secretFile, 'utf8'));
  return { GREENPLUS_DOCKER_GATEWAY_KEY: settings.GREENPLUS_DOCKER_GATEWAY_KEY };
}
function compose(args, env, timeout) { run('docker', [...composeArgs, ...args], env, timeout); }

try {
  if (action === 'up') {
    // Ensure gateway and its private network exist before joining it.
    run(process.execPath, [resolve(root, 'scripts/three-tier-docker.mjs'), 'up'], {}, 1200000);
    const env = bridgeEnv();
    compose(['config', '-q'], env, 30000);
    compose(['up', '-d', '--build', '--wait', '--wait-timeout', '240'], env, 1800000);
    compose(['exec','-T','web-admin','node','scripts/ci/check-docker-container-gateway.mjs'], env, 60000);
    console.log('PASS: Docker web stack is running. Admin (3000) can switch Supabase ↔ Docker on the private network; Client (3001) / Shipper (3002) retain Supabase.');
  } else if (action === 'check') {
    const env = bridgeEnv();
    compose(['config', '-q'], env, 30000);
    compose(['exec','-T','web-admin','node','scripts/ci/check-docker-container-gateway.mjs'], env, 60000);
    console.log('PASS: containerized Admin can authenticate to its private Docker gateway.');
  } else if (action === 'down') {
    const env = bridgeEnv();
    // Never use --volumes. Only the root WEB stack is stopped.
    compose(['down'], env, 120000);
  } else {
    console.log('Usage: node scripts/three-tier-app-stack.mjs up|check|down');
    if (action !== 'help') process.exitCode = 2;
  }
} catch (error) { console.error(`Docker web stack: ${error.message}`); process.exitCode = 1; }
