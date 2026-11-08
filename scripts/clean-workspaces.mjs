/** GreenPlus local cleanup for source-only ZIPs. Does not touch the database, secrets,
 * Docker volumes, Git files, mobile signing keys or the root node_modules cache.
 * Usage: npm run clean:preview | npm run clean:workspaces | npm run clean:zip
 */
import { lstat, mkdir, readdir, rename, rm, cp } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaces = ['web-admin', 'web-client', 'web-shipper'];
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const forZip = args.has('--for-zip');
const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const tempDirs = ['.next', '.turbo', 'out', 'dist', 'coverage', '.cache', 'test-results', 'playwright-report'];
const oldReportDirs = ['test-results', 'playwright-report'];
let removed = 0;
let moved = 0;

async function info(path) {
  try { return await lstat(path); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
async function remove(path) {
  const stat = await info(path);
  if (!stat) return;
  if (stat.isSymbolicLink()) {
    console.log(`[SKIP symlink/junction] ${path}`);
    return;
  }
  console.log(`${dryRun ? '[WOULD REMOVE]' : '[REMOVE]'} ${path}`);
  if (!dryRun) await rm(path, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
  removed++;
}
async function relocate(path, app, kind) {
  const stat = await info(path);
  if (!stat) return;
  if (stat.isSymbolicLink()) { console.log(`[SKIP symlink] ${path}`); return; }
  const destination = join(root, 'artifacts', 'playwright', app, 'legacy', `${runStamp}-${kind}`);
  console.log(`${dryRun ? '[WOULD MOVE]' : '[MOVE]'} ${path} -> ${destination}`);
  if (!dryRun) {
    await mkdir(dirname(destination), { recursive: true });
    try { await rename(path, destination); }
    catch (error) {
      if (error.code !== 'EXDEV') throw error;
      await cp(path, destination, { recursive: true, force: false, errorOnExist: true });
      await rm(path, { recursive: true, force: true });
    }
  }
  moved++;
}

for (const app of workspaces) {
  const appDir = join(root, app);
  const st = await info(appDir);
  if (!st?.isDirectory()) throw new Error(`Expected workspace not found: ${app}`);
  for (const kind of oldReportDirs) await relocate(join(appDir, kind), app, kind);
  for (const kind of tempDirs.filter(k => !oldReportDirs.includes(k))) await remove(join(appDir, kind));
  for (const entry of await readdir(appDir, { withFileTypes: true })) {
    if (entry.isFile() && (entry.name.endsWith('.tsbuildinfo') || entry.name === '.eslintcache')) {
      await remove(join(appDir, entry.name));
    }
  }
  if (forZip) await remove(join(appDir, 'node_modules'));
}
// Only temporary root Turbo outputs, never the root node_modules installation.
if (forZip) await remove(join(root, '.turbo'));
console.log(`Done: ${removed} generated items cleaned, ${moved} legacy reports moved. Root node_modules, .env, Git, and Docker volumes untouched.`);
if (forZip) console.log('After removing workspace node_modules, run npm ci at repository root before next local build/test.');
