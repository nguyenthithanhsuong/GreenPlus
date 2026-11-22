/** Explicit, transactional Next.js security refresh for all three web workspaces.
 * Dry-run is the default. --apply needs npm registry access and re-locks dependencies.
 * Never modify package-lock by hand or use npm audit fix --force.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TARGET = '16.4.6';
export const manifests = ['package.json', ...['admin', 'client', 'shipper'].map(app => `web-${app}/package.json`)];
const lockName = 'package-lock.json';
const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function versionTuple(value) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!m) throw new Error(`Unexpected Next.js version: ${value}`);
  return m.slice(1).map(Number);
}
function compareVersions(a, b) {
  const aa = versionTuple(a); const bb = versionTuple(b);
  for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return Math.sign(aa[i] - bb[i]);
  return 0;
}

export function makePlan(contents) {
  const parsed = Object.fromEntries(manifests.map(file => [file, JSON.parse(contents[file])]));
  const root = parsed['package.json'];
  const current = root.overrides?.next;
  if (typeof current !== 'string') throw new Error('Root overrides.next is missing. Review manually.');
  if (compareVersions(current, TARGET) > 0) throw new Error(`Refusing to downgrade Next.js ${current}`);
  const changes = [];
  if (current !== TARGET) {
    root.overrides.next = TARGET;
    changes.push('package.json overrides.next');
  }
  for (const app of ['admin', 'client', 'shipper']) {
    const file = `web-${app}/package.json`, p = parsed[file];
    for (const [area, key] of [['dependencies', 'next'], ['devDependencies', 'eslint-config-next']]) {
      const currentVersion = p[area]?.[key];
      if (typeof currentVersion !== 'string') throw new Error(`${file}: ${area}.${key} missing`);
      if (compareVersions(currentVersion, TARGET) > 0) throw new Error(`${file}: refusing downgrade ${currentVersion}`);
      if (currentVersion !== TARGET) {
        p[area][key] = TARGET;
        changes.push(`${file} ${area}.${key}`);
      }
    }
  }
  return { changes, updated: Object.fromEntries(manifests.map(f => [f, JSON.stringify(parsed[f], null, 2) + '\n'])) };
}

export function applyUpgrade({root = scriptRoot, runner} = {}) {
  const files = [...manifests, lockName];
  const originals = Object.fromEntries(files.map(f => [f, readFileSync(resolve(root, f), 'utf8')]));
  const plan = makePlan(originals);
  if (plan.changes.length === 0) {
    // A previous interrupted upgrade may have updated manifests but not lockfile.
    // Do not incorrectly report success until every locked package is also updated.
    const locked = JSON.parse(originals[lockName]);
    if (locked.packages?.['node_modules/next']?.version !== TARGET ||
        locked.packages?.['node_modules/eslint-config-next']?.version !== TARGET ||
        ['admin','client','shipper'].some(app => {
          const w = locked.packages?.[`web-${app}`];
          return w?.dependencies?.next !== TARGET || w?.devDependencies?.['eslint-config-next'] !== TARGET;
        })) throw new Error('Manifests target the patched Next.js version, but package-lock.json is stale. Regenerate the lockfile with npm install --package-lock-only.');
    return {changes: [], message:'Next.js security versions and lockfile already match.'};
  }
  try {
    for (const file of manifests) writeFileSync(resolve(root, file), plan.updated[file]);
    const exec = runner || (() => {
      const windows = process.platform === 'win32';
      return spawnSync(windows ? (process.env.ComSpec || 'cmd.exe') : 'npm', windows
        ? ['/d','/s','/c','npm install --package-lock-only --ignore-scripts --no-audit --no-fund']
        : ['install','--package-lock-only','--ignore-scripts','--no-audit','--no-fund'],
      {cwd: root, encoding: 'utf8', stdio: 'inherit', windowsHide: true});
    });
    const result = exec();
    if (result.error || result.status !== 0) throw new Error(`npm lockfile refresh failed (${result.error?.code || result.status})`);
    const lock = JSON.parse(readFileSync(resolve(root,lockName),'utf8'));
    if (lock.packages?.['node_modules/next']?.version !== TARGET || lock.packages?.['node_modules/eslint-config-next']?.version !== TARGET) {
      throw new Error('Regenerated lockfile does not pin Next.js and eslint-config-next to target');
    }
    for (const app of ['admin','client','shipper']) {
      const p = lock.packages?.[`web-${app}`];
      if (p?.dependencies?.next !== TARGET || p?.devDependencies?.['eslint-config-next'] !== TARGET) throw new Error(`Lockfile workspace version mismatch: ${app}`);
    }
    return {changes:plan.changes,message:'Manifests and package-lock.json updated; run npm ci, tests and npm audit.'};
  } catch (error) {
    // Restore exact pre-upgrade bytes, including lockfile, on registry/network/validation errors.
    for (const file of files) writeFileSync(resolve(root, file), originals[file]);
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--apply')) {
    try {
      const result = applyUpgrade();
      console.log(result.message);
      result.changes.forEach(c => console.log(`UPDATED: ${c}`));
    } catch (error) { console.error(`NOT APPLIED: ${error.message}`); process.exitCode = 1; }
  } else {
    const files = Object.fromEntries(manifests.map(f=>[f,readFileSync(resolve(scriptRoot,f),'utf8')]));
    try {
      const plan=makePlan(files);
      console.log(`DRY RUN: Next.js and eslint-config-next ${TARGET}; ${plan.changes.length} manifest fields to update.`);
      plan.changes.forEach(c=>console.log(`PLAN: ${c}`));
      console.log('Run with --apply to update manifests and regenerate package-lock.json.');
    } catch(error) {console.error(error.message);process.exitCode=1;}
  }
}
