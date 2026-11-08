/**
 * Connect the local Web Admin workspace to the existing three-tier gateway.
 * This writes only the ignored web-admin/.env.local and does not modify Docker
 * volumes, remote databases, .env, or any production deployment.
 */
import { readFileSync, existsSync, writeFileSync, renameSync, unlinkSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { dockerGatewayConfiguration, dockerGatewayReadiness } from '../web-admin/backend/core/docker-gateway.mjs';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DOCKER_ENV_PATH = 'docker/three-tier/.env';
export const ADMIN_ENV_PATH = 'web-admin/.env.local';
const GATEWAY_URL = 'http://127.0.0.1:4100';
const OWNED_KEYS = ['GREENPLUS_TENANCY_DEMO', 'GREENPLUS_DOCKER_GATEWAY_URL', 'GREENPLUS_DOCKER_GATEWAY_KEY'];

/** Read simple dotenv assignments without evaluating shell or interpolating values. */
export function parseEnv(text) {
  const result = Object.create(null);
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    let raw = match[2];
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) raw = raw.slice(1, -1);
    result[match[1]] = raw;
  }
  return result;
}

export function localDockerSettings(dockerEnvText) {
  const source = parseEnv(dockerEnvText);
  const gatewayKey = source.DEMO_GATEWAY_KEY ?? '';
  if (!/^[A-Za-z0-9_+\-/=]{32,}$/.test(gatewayKey))
    throw new Error('Docker gateway secret missing/invalid. Run npm run docker:three-tier:init; never paste secrets into the terminal log.');
  const config = {
    GREENPLUS_TENANCY_DEMO: 'true',
    GREENPLUS_DOCKER_GATEWAY_URL: GATEWAY_URL,
    GREENPLUS_DOCKER_GATEWAY_KEY: gatewayKey,
  };
  if (!dockerGatewayConfiguration(config).configured)
    throw new Error('Cannot establish a valid local gateway configuration');
  return config;
}

export function mergeAdminEnv(original, settings, { forceLocal = false } = {}) {
  const existing = parseEnv(original);
  const currentUrl = existing.GREENPLUS_DOCKER_GATEWAY_URL ?? '';
  if (currentUrl && currentUrl !== GATEWAY_URL && currentUrl !== 'http://localhost:4100' && !forceLocal)
    throw new Error('Admin already points at another Docker gateway; refusing to overwrite it. Use --force-local only if you explicitly want this machine.');
  // Strip only the managed settings. All unrelated env assignments and comments
  // are left untouched (including Supabase/Sentry/other auth secrets).
  const lines = original.split(/\r?\n/).filter(line => {
    if (/^# Local three-tier Docker gateway \(managed by scripts\/three-tier-connect-admin\.mjs\)$/.test(line)) return false;
    const match = /^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=/.exec(line);
    return !match || !OWNED_KEYS.includes(match[1]);
  });
  // Preserve original line ending, avoid accumulating blank lines on reruns.
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const prefix = lines.join(eol).trimEnd();
  return (prefix ? `${prefix}${eol}${eol}` : '') +
    `# Local three-tier Docker gateway (managed by scripts/three-tier-connect-admin.mjs)${eol}` +
    OWNED_KEYS.map(key => `${key}=${settings[key]}`).join(eol) + eol;
}

function readIfPresent(path) { return existsSync(path) ? readFileSync(path, 'utf8') : ''; }

async function assertGatewayLive(settings, fetcher) {
  const state = await dockerGatewayReadiness(settings, fetcher);
  if (!state.ready) throw new Error(`Docker gateway not ready/authenticated (${state.reason}). Run npm run docker:three-tier:check first.`);
}

/**
 * Connect: write workspace env once gateway is authenticated.
 * Check: check actual workspace env and gateway with zero writes.
 */
export async function connectLocalAdmin({ root = projectRoot, checkOnly = false, forceLocal = false, fetcher = fetch } = {}) {
  const dockerFile = resolve(root, DOCKER_ENV_PATH);
  const adminFile = resolve(root, ADMIN_ENV_PATH);
  if (!existsSync(dockerFile)) throw new Error('Missing local Docker .env. Run npm run docker:three-tier:init first.');
  const settings = localDockerSettings(readFileSync(dockerFile, 'utf8'));
  const existing = readIfPresent(adminFile);
  if (checkOnly) {
    const admin = parseEnv(existing);
    if (OWNED_KEYS.some(key => admin[key] !== settings[key]))
      throw new Error('Admin local gateway settings are missing/outdated. Run npm run docker:three-tier:link-admin then restart Admin.');
  } else {
    // Check for remote configuration before any remote/local credential operation.
    mergeAdminEnv(existing, settings, { forceLocal });
  }
  await assertGatewayLive(settings, fetcher);
  if (checkOnly) return { ready: true, changed: false };
  const merged = mergeAdminEnv(existing, settings, { forceLocal });
  if (existing === merged) return { ready: true, changed: false };
  // Save atomically, preserve the existing file permissions when possible.
  // This file is ignored by git; do not write any credentials to repo-tracked files.
  const tmp = `${adminFile}.${randomBytes(6).toString('hex')}.tmp`;
  const mode = existsSync(adminFile) ? statSync(adminFile).mode & 0o777 : 0o600;
  try {
    writeFileSync(tmp, merged, { mode, flag: 'wx' });
    renameSync(tmp, adminFile);
  } finally {
    if (existsSync(tmp)) unlinkSync(tmp);
  }
  return { ready: true, changed: true };
}

function invokedDirectly() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
if (invokedDirectly()) {
  const command = process.argv[2] ?? 'connect';
  if (!['connect','check'].includes(command)) {
    console.error('Usage: node scripts/three-tier-connect-admin.mjs connect|check [--force-local]');
    process.exitCode = 2;
  } else {
    try {
      const state = await connectLocalAdmin({ checkOnly: command === 'check', forceLocal: process.argv.includes('--force-local') });
      console.log(state.changed
        ? 'PASS: Admin Docker Local settings synced to web-admin/.env.local. Restart Admin to load them; no credentials printed.'
        : 'PASS: Admin Docker Local settings and authenticated gateway are ready.');
    } catch (error) {
      console.error(`FAIL Admin Docker connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exitCode = 1;
    }
  }
}
