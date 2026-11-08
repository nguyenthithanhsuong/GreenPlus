/**
 * GreenPlus repository maintenance (non-destructive by default).
 *
 * scan                      read-only scan and JSON report
 * clean                     dry-run candidate cleanup
 * clean --apply             move verified unused files to artifacts/maintenance/quarantine
 * restore [--batch=<id>]    restore one quarantined batch (default: latest)
 * verify [--build] [--docker] run source/test gates (no database mutations)
 * all [--apply] [--no-build] [--zip] [--generated] [--legacy-flutter]
 *
 * Historical migrations, public assets, Next route entrypoints, auth and real
 * business logic are never inferred to be unused from missing inbound imports.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  lstat, readFile, readdir, mkdir, rename, rm, rmdir, writeFile,
} from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, posix, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quarantineRoot = 'artifacts/maintenance/quarantine';
const manifestRel = 'scripts/maintenance/legacy-candidates.json';
const codeExt = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const scanExt = new Set([...codeExt, '.json', '.yaml', '.yml', '.sh', '.ps1']);
const ignoreDirs = new Set([
  '.git', '.next', '.turbo', 'node_modules', '.vercel', '.cache', 'artifacts',
  'coverage', 'dist', 'out', 'build', 'test-results', 'playwright-report',
  '.gradle', '.dart_tool', '.temp', '.idea', '.vscode', '__pycache__',
]);
const optionalLockErrors = new Set(['EBUSY', 'EPERM', 'EACCES']);
const emptyDirectoryRaceErrors = new Set(['EBUSY', 'EPERM', 'EACCES', 'ENOTEMPTY']);
const emptiesScope = [
  'web-admin/backend', 'web-admin/frontend', 'web-admin/src',
  'web-client/backend', 'web-client/frontend', 'web-client/src',
  'web-shipper/src', 'packages',
];

function safeRel(path) {
  if (!path || isAbsolute(path) || path.includes('\\') || path.split('/').some(x => !x || x === '.' || x === '..')) {
    throw new Error(`Unsafe path in maintenance manifest: ${path}`);
  }
  return path;
}
function within(root, child) {
  const out = resolve(root, safeRel(child));
  if (!out.startsWith(`${root}${sep}`)) throw Error(`Outside project root: ${child}`);
  return out;
}
async function stat(path) {
  try { return await lstat(path); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
function digest(data) { return createHash('sha256').update(data).digest('hex'); }
async function walk(root, sub = '', collect = []) {
  const full = sub ? within(root, sub) : root;
  for (const entry of await readdir(full, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue; // No traversal through junctions/symlinks
    const rel = sub ? `${sub}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) await walk(root, rel, collect);
    } else if (entry.isFile() && scanExt.has(extname(entry.name))) {
      collect.push(rel);
    }
  }
  return collect;
}
function importedSpecs(source) {
  const result = [];
  // Static imports/re-exports, dynamic import(), require(), and side-effect imports.
  const re = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)["'`]([^"'`]+)["'`]/g;
  for (const match of source.matchAll(re)) result.push(match[1].split('?')[0]);
  return result;
}
function resolvedSpec(importer, spec) {
  if (spec.startsWith('.')) return posix.normalize(posix.join(posix.dirname(importer), spec));
  const appRoot = importer.split('/')[0];
  if (spec.startsWith('@/') && /^web-(?:admin|client|shipper)$/.test(appRoot)) {
    return `${appRoot}/src/${spec.slice(2)}`;
  }
  return null;
}
function targetsCandidate(importer, spec, candidate) {
  const resolved = resolvedSpec(importer, spec);
  return resolved !== null && (
    resolved === candidate || `${resolved}${extname(candidate)}` === candidate ||
    `${resolved}/index${extname(candidate)}` === candidate
  );
}
async function loadAllowlist(root) {
  const data = JSON.parse(await readFile(within(root, manifestRel), 'utf8'));
  if (!Array.isArray(data.candidates)) throw Error('Maintenance allowlist is invalid');
  return data.candidates.map(entry => {
    const path = safeRel(entry.path);
    if (!(/^(?:web-admin|web-client|web-shipper)\//.test(path) || path === 'scripts/remove-legacy-sentry-configs.mjs') ||
        /(?:^|\/)(?:src\/app|public|middleware\.ts|instrumentation[^/]*|next\.config\.ts|\.env[^/]*)/.test(path) ||
        !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw Error(`Maintenance allowlist contains protected/invalid path: ${path}`);
    }
    return { path, sha256: entry.sha256 };
  });
}
/** Extra, opt-in cleanup only for obsolete Flutter prototypes; never TWA sources. */
async function planLegacyFlutter(root) {
  const manifest = JSON.parse(await readFile(within(root, manifestRel), 'utf8'));
  const plans = [];
  for (const group of manifest.optionalLegacyFlutter || []) {
    if (!['mobile/customer_app', 'mobile/shipper_app'].includes(group.path)) throw Error('Unapproved legacy directory');
    const folder = within(root, group.path);
    const st = await stat(folder);
    if (!st) { plans.push({path:group.path,decision:'already-absent',reasons:[]}); continue; }
    const reasons = [];
    if (!st.isDirectory() || st.isSymbolicLink()) reasons.push('Not a regular folder');
    const listed = (group.files || []).map(f => safeRel(f.path));
    const scanned = [];
    async function list(rel) {
      for (const e of await readdir(within(root, rel), {withFileTypes:true})) {
        const child = `${rel}/${e.name}`;
        if (e.isSymbolicLink()) { reasons.push(`Linked path: ${child}`); continue; }
        if (e.isDirectory()) await list(child);
        else if (e.isFile()) scanned.push(child);
        else reasons.push(`Special file: ${child}`);
      }
    }
    if (!reasons.length) await list(group.path);
    if (scanned.length !== listed.length || scanned.some(f => !listed.includes(f))) reasons.push('Folder contents differ from audited ZIP');
    for (const entry of group.files || []) {
      const file = within(root, entry.path);
      if (!(await stat(file)) || digest(await readFile(file)) !== entry.sha256) {
        reasons.push(`File changed: ${entry.path}`); break;
      }
    }
    if (!reasons.length) {
      // Docs can mention historical Flutter; CI/scripts/config must not invoke it.
      const codeFiles = (await walk(root)).filter(f => !f.startsWith(`${group.path}/`) && f !== manifestRel && f !== 'scripts/repo-maintenance.mjs' && f !== 'tests/repo-maintenance.test.mjs');
      for (const file of codeFiles) {
        const text = await readFile(within(root, file), 'utf8');
        if (text.includes(group.path)) { reasons.push(`Active source reference: ${file}`); break; }
      }
    }
    plans.push({path:group.path, decision:reasons.length?'skip':'eligible', reasons});
  }
  return plans;
}

/** Inspect an explicit, checksum-pinned allowlist. Nothing is deleted here. */
export async function planCleanup(root, allowlist) {
  root = resolve(root);
  const codeFiles = (await walk(root)).filter(path => path !== manifestRel);
  const decoded = await Promise.all(codeFiles.map(async file => [file, await readFile(within(root, file), 'utf8')]));
  const initialReasons = new Map();
  for (const entry of allowlist) {
    const path = safeRel(entry.path);
    const target = within(root, path);
    const st = await stat(target);
    if (!st) { initialReasons.set(path, ['already-absent']); continue; }
    if (!st.isFile() || st.isSymbolicLink()) {
      initialReasons.set(path, ['Not a regular file']); continue;
    }
    if (path === 'scripts/remove-legacy-sentry-configs.mjs' &&
        (await stat(within(root, 'web-admin/sentry.client.config.ts')) || await stat(within(root, 'web-client/sentry.client.config.ts')))) {
      initialReasons.set(path, ['Legacy Sentry configs still exist; run migration before removing its helper']);
      continue;
    }
    const hash = digest(await readFile(target));
    if (hash !== entry.sha256) {
      initialReasons.set(path, ['Checksum differs from audited ZIP; review updated source manually']);
    }
  }
  const canRemove = new Set(allowlist.filter(c => !initialReasons.has(c.path)).map(c => c.path));
  const blockers = new Map();
  // Fixed point: a file skipped from cleanup becomes an active consumer of other candidates.
  // This avoids breaking an older module still referenced by a modified legacy file.
  let changed;
  do {
    changed = false;
    for (const candidate of [...canRemove]) {
      const reasons = [];
      for (const [sourcePath, text] of decoded) {
        if (sourcePath === candidate || canRemove.has(sourcePath) ||
            (['scripts/repo-maintenance.mjs', 'tests/repo-maintenance.test.mjs'].includes(sourcePath) &&
             candidate === 'scripts/remove-legacy-sentry-configs.mjs')) continue;
        const suffix = candidate.split('/').slice(1).join('/');
        if (text.includes(candidate) || text.includes(suffix)) {
          reasons.push(`Explicit path reference: ${sourcePath}`);
        } else if (codeExt.has(extname(sourcePath)) && importedSpecs(text).some(spec => targetsCandidate(sourcePath, spec, candidate))) {
          reasons.push(`Module import: ${sourcePath}`);
        }
        if (reasons.length >= 12) break;
      }
      if (reasons.length) {
        canRemove.delete(candidate);
        blockers.set(candidate, reasons);
        changed = true;
      }
    }
  } while (changed);
  return allowlist.map(entry => {
    const initial = initialReasons.get(entry.path) || [];
    const absent = initial.includes('already-absent');
    const reasons = [...initial.filter(x => x !== 'already-absent'), ...(blockers.get(entry.path) || [])];
    return { path: entry.path, decision: absent ? 'already-absent' : canRemove.has(entry.path) ? 'eligible' : 'skip', reasons };
  });
}

async function writeAtomic(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, { flag: 'w' });
  await rename(temp, path);
}
async function pruneEmptyFolders(root, apply) {
  const found = [];
  async function visit(rel) {
    const full = within(root, rel);
    const st = await stat(full);
    if (!st || !st.isDirectory() || st.isSymbolicLink()) return;
    for (const item of await readdir(full, { withFileTypes: true })) {
      if (item.isDirectory() && !item.isSymbolicLink() && !ignoreDirs.has(item.name)) await visit(`${rel}/${item.name}`);
    }
    if (emptiesScope.includes(rel)) return; // Keep recognizable feature roots.
    const children = await readdir(full);
    if (children.length === 0) {
      if (!apply) { found.push(rel); return; }
      try {
        await rmdir(full);
        found.push(rel);
      } catch (error) {
        // VS Code/Windows can briefly lock or recreate a source directory.
        // Cleanup is optional: never abort a verified source cleanup for this.
        if (!emptyDirectoryRaceErrors.has(error.code)) throw error;
        console.warn(`[EMPTY DIR SKIPPED] ${rel} (${error.code})`);
      }
    }
  }
  for (const rel of emptiesScope) await visit(rel);
  return found;
}
function batchName() {
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  return `batch-${iso}-${process.pid}`;
}
/** A failed or interrupted move must be recovered before beginning a new batch. */
async function assertNoInterruptedBatches(root) {
  for (const name of await listBatches(root)) {
    const file = within(root, `${quarantineRoot}/${name}/manifest.json`);
    let metadata;
    try { metadata = JSON.parse(await readFile(file, 'utf8')); }
    catch { throw Error(`Unreadable quarantine manifest: ${name}. Inspect manually before applying cleanup.`); }
    if (['applying', 'failed', 'restoring'].includes(metadata.status)) {
      throw Error(`Unfinished cleanup ${name}; restore first: node scripts/repo-maintenance.mjs restore --batch=${name}`);
    }
  }
}

/**
 * Move only explicit checksum-approved files. Optional Flutter folders may be
 * locked by Windows/IDE; skip those folders, not the entire maintenance run.
 * Mandatory failures immediately roll back all moves from this batch.
 * `move` is injectable solely for deterministic failure-injection tests.
 */
export async function quarantineFiles(root, allowlist, { apply = false, legacyFlutter = false, move = rename } = {}) {
  root = resolve(root);
  const plan = await planCleanup(root, allowlist);
  const flutterPlan = legacyFlutter ? await planLegacyFlutter(root) : [];
  const eligible = plan.filter(x => x.decision === 'eligible');
  for (const finding of plan) {
    const detail = finding.reasons.length ? ` — ${finding.reasons.slice(0, 2).join('; ')}` : '';
    console.log(`[${finding.decision}] ${finding.path}${detail}`);
  }
  for (const item of flutterPlan) console.log(`[Flutter ${item.decision}] ${item.path}${item.reasons.length ? ` — ${item.reasons.join('; ')}` : ''}`);
  const emptyBefore = await pruneEmptyFolders(root, false);
  console.log(`Candidates: ${eligible.length}/${plan.length}; Flutter folders: ${flutterPlan.filter(x=>x.decision==='eligible').length}; empty source directories: ${emptyBefore.length}`);
  if (!apply) { console.log('DRY RUN only. Apply with --apply. No files changed.'); return null; }
  await assertNoInterruptedBatches(root);
  if (eligible.length === 0 && emptyBefore.length === 0 && !flutterPlan.some(x=>x.decision==='eligible')) return null;
  const name = batchName();
  const dir = within(root, `${quarantineRoot}/${name}`);
  const metadata = {
    version: 2, name, date: new Date().toISOString(), status: 'applying',
    source: 'checksum-pinned legacy candidates', moved: [], movedDirs: [],
    pendingMove: null, skippedFlutter: [], emptyDirs: [],
  };
  const journal = () => writeAtomic(join(dir, 'manifest.json'), metadata);
  await mkdir(dir, { recursive: true });
  await journal();
  try {
    for (const item of eligible) {
      const from = within(root, item.path);
      const to = within(dir, item.path);
      await mkdir(dirname(to), { recursive: true });
      // Journal intent *before* moving, so a failed manifest write or process
      // interruption never leaves a moved file invisible to restoreBatch().
      metadata.pendingMove = { path: item.path, kind: 'file' };
      await journal();
      await move(from, to);
      metadata.moved.push(item.path);
      metadata.pendingMove = null;
      await journal();
      console.log(`[QUARANTINED] ${item.path}`);
    }
    for (const item of flutterPlan.filter(x=>x.decision==='eligible')) {
      const from = within(root, item.path);
      const to = within(dir, item.path);
      await mkdir(dirname(to), {recursive:true});
      metadata.pendingMove = { path: item.path, kind: 'directory' };
      await journal();
      try {
        await move(from, to);
      } catch (error) {
        // A locked optional prototype does not invalidate the mandatory
        // cleanup. Never attempt to copy/delete a locked directory.
        if (!optionalLockErrors.has(error.code) || !(await stat(from)) || (await stat(to))) throw error;
        metadata.skippedFlutter.push({path:item.path, reason:error.code});
        metadata.pendingMove = null;
        await journal();
        console.warn(`[FLUTTER SKIPPED] ${item.path} is locked (${error.code}); source preserved. Close IDE/Explorer and retry later.`);
        continue;
      }
      metadata.movedDirs.push(item.path);
      metadata.pendingMove = null;
      await journal();
      console.log(`[FLUTTER QUARANTINED] ${item.path}`);
    }
    metadata.emptyDirs = await pruneEmptyFolders(root, true);
    metadata.status = 'quarantined';
    await journal();
  } catch (error) {
    console.error(`Cleanup interrupted (${error.code || error.message}); attempting immediate rollback of ${name}.`);
    try {
      metadata.status = 'failed';
      // The previous journal still contains pendingMove if the write fails.
      await journal();
    } catch (journalError) {
      console.error(`Cannot update quarantine journal (${journalError.message}); recovery will use existing journal.`);
    }
    try {
      await restoreBatch(root, name);
      console.error(`Rollback complete: batch ${name} restored; no partial cleanup retained.`);
    } catch (restoreError) {
      throw new Error(`Cleanup failed (${error.message}); automatic rollback failed (${restoreError.message}). ` +
        `STOP and restore manually: node scripts/repo-maintenance.mjs restore --batch=${name}`);
    }
    throw new Error(`Cleanup failed (${error.message}); all quarantined files were restored.`);
  }
  if (metadata.skippedFlutter.length) {
    console.warn(`Optional Flutter cleanup incomplete: ${metadata.skippedFlutter.map(x=>x.path).join(', ')}. Other checks will continue.`);
  }
  console.log(`Restore anytime with: node scripts/repo-maintenance.mjs restore --batch=${name}`);
  return name;
}
async function listBatches(root) {
  const base = within(root, quarantineRoot);
  if (!(await stat(base))) return [];
  const names = (await readdir(base)).filter(x => /^batch-20[0-9TZ-]+$/.test(x));
  return names.sort();
}
export async function restoreBatch(root, batch = 'latest') {
  root = resolve(root);
  if (batch === 'latest') batch = (await listBatches(root)).at(-1);
  if (!batch || !/^batch-20[0-9TZ-]+$/.test(batch)) throw Error('No valid quarantine batch');
  const dir = within(root, `${quarantineRoot}/${batch}`);
  const metadata = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
  if (metadata.name !== batch || !Array.isArray(metadata.moved)) throw Error('Invalid restore metadata');
  const intent = metadata.pendingMove;
  if (intent && (!['file','directory'].includes(intent.kind) || typeof intent.path !== 'string')) {
    throw Error('Invalid pendingMove in quarantine manifest');
  }
  const moved = [...metadata.moved];
  const movedDirs = [...(metadata.movedDirs || [])];
  if (intent?.kind === 'file' && !moved.includes(intent.path)) moved.push(intent.path);
  if (intent?.kind === 'directory' && !movedDirs.includes(intent.path)) movedDirs.push(intent.path);
  if (metadata.version >= 2) {
    metadata.status = 'restoring';
    await writeAtomic(join(dir, 'manifest.json'), metadata);
  }
  let restored = 0;
  for (const file of moved.reverse()) {
    safeRel(file);
    const src = within(dir, file);
    const dst = within(root, file);
    if (!(await stat(src))) continue; // Supports retry after interrupted restore.
    if (await stat(dst)) throw Error(`Refusing to overwrite changed source: ${file}`);
    await mkdir(dirname(dst), { recursive: true });
    await rename(src, dst);
    restored++;
    console.log(`[RESTORED] ${file}`);
  }
  for (const path of movedDirs.reverse()) {
    if (!['mobile/customer_app', 'mobile/shipper_app'].includes(path)) throw Error(`Invalid restore directory: ${path}`);
    const src = within(dir, path);
    const dst = within(root, path);
    if (!(await stat(src))) continue;
    if (await stat(dst)) throw Error(`Refusing to overwrite existing directory: ${path}`);
    await mkdir(dirname(dst), {recursive:true});
    await rename(src, dst);
    restored++;
    console.log(`[FLUTTER RESTORED] ${path}`);
  }
  metadata.pendingMove = null;
  metadata.restoredAt = new Date().toISOString();
  if (metadata.version >= 2) metadata.status = 'restored';
  await writeAtomic(join(dir, 'manifest.json'), metadata);
  return restored;
}
// Node 24 warns about `spawnSync('npm', args, { shell: true })` (DEP0190),
// because arguments are concatenated by the shell. On Windows npm is a .cmd
// shim, so invoke cmd.exe explicitly with a *validated*, fixed npm script.
// No user-controlled paths, flags or commands are interpolated into /c.
export function maintenanceCommandSpec(command, args, platform = process.platform, comspec = process.env.ComSpec) {
  if (platform !== 'win32' || command !== 'npm') return { command, args };
  if (args.length !== 2 || args[0] !== 'run' || !/^[a-z0-9][a-z0-9:.-]*$/i.test(args[1])) {
    throw Error('Unsafe npm invocation in maintenance runner');
  }
  return { command: comspec || 'cmd.exe', args: ['/d', '/s', '/c', `npm run ${args[1]}`] };
}
function run(root, command, args) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const invocation = maintenanceCommandSpec(command, args);
  const result = spawnSync(invocation.command, invocation.args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`Command failed (${result.status ?? 'signal'}): ${command} ${args.join(' ')}`);
}
async function verify(root, { build = false, docker = false } = {}) {
  if (!existsSync(join(root, 'node_modules'))) throw Error('Run npm ci first (root node_modules missing)');
  for (const script of ['lint', 'typecheck', 'test:release:static']) run(root, 'npm', ['run', script]);
  if (build) run(root, 'npm', ['run', 'build']);
  if (docker) {
    // check is non-mutating; migrations, up and down are intentionally not launched.
    run(root, 'npm', ['run', 'docker:three-tier:check']);
    for (const s of ['test:three-tier-commerce:docker', 'test:three-tier-transactions:docker', 'test:three-tier-lifecycle:docker']) run(root, 'npm', ['run', s]);
  }
  console.log('\nPASS: requested verification gates completed.');
}
async function report(root, findings) {
  const issues = [
    ['Audit observers', 'Manual code change: replace no-op audit with DB-transactional AuditWriter and rollback test'],
    ['Payment mock', 'Manual code change: do not treat simulation strategies as real payment authorization'],
    ['Legacy /backend pages', 'Manual review: restrict or migrate test UI before removing routes'],
    ['Architecture folders', 'Refactor one domain with import compatibility + E2E; do not bulk-rename'],
    ['AI assist', 'Implement store-scoped read models, prediction records, Manager approval, and audit/outbox'],
    ['Supabase migration 0016', 'Compare Git / remote migration history before applying or changing migrations'],
    ['Docker Client/Shipper cutover', 'Not automatic; requires auth/RLS, schema parity and end-to-end lifecycle checks'],
  ];
  const output = { createdAt: new Date().toISOString(), source: 'GreenPlus Source 2026-11-08 allowlist', files: findings, manualWork: issues };
  const path = within(root, 'artifacts/maintenance/latest-report.json');
  await writeAtomic(path, output);
  console.log(`Audit report (no secret contents): ${path}`);
  console.log(`Eligible: ${findings.filter(x=>x.decision==='eligible').length}, blocked: ${findings.filter(x=>x.decision==='skip').length}; manual work: ${issues.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'scan';
  const flags = new Set(args.slice(1));
  const root = projectRoot;
  if (!['scan','clean','restore','verify','all'].includes(cmd)) throw Error(`Unknown command: ${cmd}`);
  if (cmd === 'restore') {
    const found = args.find(x => x.startsWith('--batch='));
    await restoreBatch(root, found ? found.split('=')[1] : 'latest');
    return;
  }
  if (cmd === 'verify') { await verify(root, { build: flags.has('--build'), docker: flags.has('--docker') }); return; }
  const allowlist = await loadAllowlist(root);
  if (cmd === 'scan') { await report(root, await planCleanup(root, allowlist)); return; }
  if (cmd === 'clean') { await quarantineFiles(root, allowlist, { apply: flags.has('--apply'), legacyFlutter: flags.has('--legacy-flutter') }); return; }
  if (cmd === 'all') {
    const apply = flags.has('--apply');
    if (apply && !existsSync(join(root,'node_modules'))) throw Error('Run npm ci first before applying cleanup; verification is mandatory');
    const batch = await quarantineFiles(root, allowlist, { apply, legacyFlutter: flags.has('--legacy-flutter') });
    if (!apply) { await report(root, await planCleanup(root, allowlist)); console.log('Use --apply to quarantine and verify.'); return; }
    try {
      await verify(root, { build: !flags.has('--no-build'), docker: flags.has('--docker') });
      if (flags.has('--generated')) run(root,'npm',['run','clean:zip']);
      if (flags.has('--zip')) run(root,'npm',['run','zip:source']);
      console.log('Maintenance complete; inspect git diff and commit intentional removals only.');
    } catch (error) {
      if (batch) {
        console.error('Verification failed: restoring quarantined source files automatically.');
        await restoreBatch(root, batch);
      }
      throw error;
    }
    return;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`FAIL maintenance: ${error.message}`); process.exitCode = 1; });
}
