#!/usr/bin/env node
/**
 * One-time, opt-in local consolidation of Next.js workspace dotenv files.
 * Never sends secrets to logs, changes Docker settings, or touches production.
 */
import { existsSync, lstatSync, readFileSync, renameSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WEB_APPS = ['web-admin', 'web-client', 'web-shipper'];
const LEGACY_FILES = ['.env.local', '.env'];

function safeFile(file) {
  if (!existsSync(file)) return '';
  if (!lstatSync(file).isFile()) throw Error(`Not a regular dotenv file: ${file}`);
  return readFileSync(file, 'utf8');
}

/** Conservative parser: refuses multiline/unknown syntax instead of risking lost secrets. */
export function readAssignments(text, fileLabel) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const assignment = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!assignment) throw Error(`Unsupported dotenv syntax in ${fileLabel}; review manually (values not printed)`);
    const [, key, unparsed] = assignment;
    let value = unparsed.trim();
    if (value.startsWith('"') || value.startsWith("'")) {
      if (value.length < 2 || value.at(-1) !== value[0]) throw Error(`Multiline/unsupported quoted value for ${key} in ${fileLabel}`);
      value = value.slice(1, -1);
    } else value = value.replace(/\s+#.*$/, '').trim();
    if (out.has(key) && out.get(key).value !== value) throw Error(`Conflicting duplicate ${key} in ${fileLabel}`);
    out.set(key, { value, line });
  }
  return out;
}

/**
 * The Docker gateway key is managed by scripts/three-tier-connect-admin.mjs.
 * Ignore a stale workspace copy only when the shared root value matches the
 * actual local Docker gateway source. Never pick a key just because it exists.
 */
function rootGatewayKeyMatchesDocker(root, rootAssignments) {
  const sharedKey = rootAssignments.get('GREENPLUS_DOCKER_GATEWAY_KEY')?.value;
  if (!sharedKey || sharedKey.length < 32) return false;
  const dockerFile = resolve(root, 'docker/three-tier/.env');
  if (!existsSync(dockerFile)) return false;
  try {
    const dockerAssignments = readAssignments(safeFile(dockerFile), 'docker/three-tier/.env');
    return dockerAssignments.get('DEMO_GATEWAY_KEY')?.value === sharedKey;
  } catch {
    // Fail closed when the Docker dotenv syntax is unknown.
    return false;
  }
}

export function planUnification(root = PROJECT_ROOT) {
  const destination = resolve(root, '.env.local');
  const existing = safeFile(destination);
  const merged = readAssignments(existing, '.env.local');
  const verifiedGatewayKey = rootGatewayKeyMatchesDocker(root, merged);
  const sources = [];
  const added = [];
  const conflicts = new Set();
  const obsoleteGatewayCopies = [];
  for (const app of WEB_APPS) {
    for (const name of LEGACY_FILES) {
      const relative = `${app}/${name}`;
      const file = resolve(root, relative);
      if (!existsSync(file)) continue;
      const text = safeFile(file);
      const assignments = readAssignments(text, relative);
      const backup = `${file}.greenplus-migrated.bak`;
      if (existsSync(backup)) throw Error(`Backup already exists for ${relative}; refusing to overwrite it`);
      sources.push({ file, relative, backup });
      for (const [key, entry] of assignments) {
        if (merged.has(key)) {
          if (merged.get(key).value !== entry.value) {
            if (key === 'GREENPLUS_DOCKER_GATEWAY_KEY' && verifiedGatewayKey) {
              // Backup retains the old value. Never propagate it into root env.
              obsoleteGatewayCopies.push(relative);
            } else conflicts.add(key);
          }
          continue;
        }
        merged.set(key, entry);
        added.push(key);
      }
    }
  }
  return { destination, existing, sources, added, conflicts: [...conflicts].sort(), obsoleteGatewayCopies, merged };
}

export function applyUnification(root = PROJECT_ROOT) {
  const plan = planUnification(root);
  if (plan.conflicts.length) throw Error(`Conflicting key names (${plan.conflicts.join(', ')}); resolve manually before retrying. No files changed.`);
  if (!plan.sources.length) return { moved: 0, added: 0 };
  const newLines = plan.added.map(k => plan.merged.get(k).line);
  const eol = plan.existing.includes('\r\n') ? '\r\n' : '\n';
  const original = plan.existing.trimEnd();
  const mergedText = original + (original ? `${eol}${eol}` : '') + '# Consolidated from workspace dotenv files; backups kept in each app' + eol + newLines.join(eol) + (newLines.length ? eol : '');
  // Write destination atomically and move legacy files to ignored backups.
  const temp = `${plan.destination}.${randomBytes(8).toString('hex')}.tmp`;
  const mode = existsSync(plan.destination) ? statSync(plan.destination).mode & 0o777 : 0o600;
  try {
    writeFileSync(temp, mergedText, { mode, flag: 'wx' });
    renameSync(temp, plan.destination);
    for (const source of plan.sources) renameSync(source.file, source.backup);
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
  return { moved: plan.sources.length, added: plan.added.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.CI === 'true' || process.env.NODE_ENV === 'production') {
    console.error('This local-env migration must not run in CI/production.');
    process.exitCode = 1;
  } else if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== '--apply')) {
    console.error('Usage: node scripts/unify-web-env.mjs [--apply] (default: plan only)');
    process.exitCode = 2;
  } else {
    try {
      const plan = planUnification();
      console.log(`Shared target: .env.local; workspace dotenv files: ${plan.sources.length}; new key names: ${plan.added.length}.`);
      if (plan.obsoleteGatewayCopies.length) {
        console.log(`Gateway key: shared root matches local Docker gateway; ${plan.obsoleteGatewayCopies.length} stale workspace copies will be archived (values hidden).`);
      }
      if (plan.conflicts.length) {
        console.error(`BLOCKED: conflicting key names: ${plan.conflicts.join(', ')}. Resolve manually; no secrets printed.`);
        process.exitCode = 1;
      } else if (process.argv.includes('--apply')) {
        const result = applyUnification();
        console.log(`PASS: ${result.moved} workspace env files moved to local .greenplus-migrated.bak backups; ${result.added} keys consolidated. Restart all web apps.`);
      } else {
        console.log('PLAN ONLY: no changes. To move and merge after review: node scripts/unify-web-env.mjs --apply');
      }
    } catch (error) { console.error(`BLOCKED: ${error.message}`); process.exitCode = 1; }
  }
}
