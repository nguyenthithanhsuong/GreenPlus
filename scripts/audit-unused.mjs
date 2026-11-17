#!/usr/bin/env node
/**
 * GreenPlus read-only repository inventory.
 * Finds *candidates* with no statically discoverable incoming references;
 * Next.js routes, migrations, configs, tests, assets, and runtime entry points
 * are never treated as deletable solely because no import points to them.
 * Uses Node built-ins, never removes/moves source, accesses Docker or Supabase.
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirs = new Set(['.git', 'node_modules', '.next', '.turbo', '.cache', '.vercel', 'artifacts', 'coverage', 'dist', 'out', 'build', 'test-results', 'playwright-report', '.dart_tool', '.gradle', '__pycache__', '.pytest_cache', '.idea', '.vscode', '.temp']);
const codeExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts']);
const textExtensions = new Set([...codeExtensions, '.json', '.yaml', '.yml', '.toml', '.md', '.mdx', '.css', '.scss', '.html', '.sh', '.ps1', '.py', '.dart', '.sql']);
const extensions = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.scss'];
const specialNextFiles = /^(?:page|layout|route|loading|error|global-error|not-found|default|template|head|instrumentation|middleware|sitemap|robots|manifest|icon|apple-icon|opengraph-image|twitter-image)\.(?:[cm]?[jt]sx?|json)$/;
const appPrefixes = ['web-admin', 'web-client', 'web-shipper'];
const normalize = v => v.split(sep).join('/');

export async function listRepoFiles(root) {
  const result = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) await visit(join(dir, entry.name));
      } else if (entry.isFile()) {
        const path = normalize(relative(root, join(dir, entry.name)));
        if (entry.name.startsWith('.env') || /\.(?:bak|pem|p12|pfx|key|sqlite|db|apk|aab)$/i.test(entry.name)) continue;
        result.push(path);
      }
    }
  }
  await visit(root);
  return result.sort();
}
function isEntry(path) {
  if (path.startsWith('.github/') || path.startsWith('supabase/') || path.startsWith('docker/') || path.startsWith('nginx/') || path.startsWith('mobile/') || path.startsWith('after_app_deployment/')) return true;
  if (/^(?:README\.md|package(?:-lock)?\.json|turbo\.json|docker-compose.*|\.gitignore|\.npmrc)$/.test(path)) return true;
  if (path.includes('/public/') || path.includes('/tests/') || path.startsWith('tests/')) return true;
  if (/^(?:scripts\/ci\/.*\.json|scripts\/maintenance\/.*\.json)$/.test(path)) return true;
  if (appPrefixes.some(app => path.startsWith(`${app}/src/app/`)) && specialNextFiles.test(posix.basename(path))) return true;
  if (appPrefixes.some(app => path.startsWith(`${app}/`) && (/^(?:next|postcss|eslint|playwright|tailwind|sentry\.|instrumentation|middleware)/.test(path.slice(app.length + 1)) || /^(?:package\.json|tsconfig\.json|next-env\.d\.ts)$/.test(path.slice(app.length + 1))))) return true;
  if (/^packages\/[^/]+\/package\.json$/.test(path)) return true;
  return false;
}
function moduleSpecs(source) {
  // Static imports / export-from, side effects, require and literal dynamic imports.
  const found = new Set();
  const regex = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)["'`]([^"'`\r\n]+)["'`]/g;
  for (const match of source.matchAll(regex)) found.add(match[1].split('?')[0]);
  return [...found];
}
function resolveModule(importer, spec, files, packages) {
  let target;
  if (spec.startsWith('.')) target = posix.normalize(posix.join(posix.dirname(importer), spec));
  else if (spec.startsWith('@/')) {
    const app = appPrefixes.find(app => importer.startsWith(`${app}/`));
    if (!app) return null;
    target = `${app}/src/${spec.slice(2)}`;
  } else {
    const entry = [...packages].sort((a, b) => b[0].length - a[0].length).find(([name]) => spec === name || spec.startsWith(name + '/'));
    if (!entry) return null;
    const [name, info] = entry;
    const subpath = spec === name ? '.' : `./${spec.slice(name.length + 1)}`;
    const dest = info.exports?.[subpath] || (subpath === '.' ? info.main : null);
    if (typeof dest !== 'string') return null;
    target = posix.normalize(`${info.root}/${dest}`);
  }
  // TS import './foo.js' can resolve to './foo.ts' in source.
  const candidates = [target, ...extensions.map(extension => `${target}${extension}`), ...extensions.map(extension => `${target}/index${extension}`)];
  if (/\.[cm]?jsx?$/.test(target)) {
    const stem = target.replace(/\.[cm]?jsx?$/, '');
    candidates.push(...['.ts', '.tsx', '.mts', '.cts'].map(extension => stem + extension));
  }
  return candidates.find(path => files.has(path)) || null;
}
function routeInfo(path) {
  const app = appPrefixes.find(name => path.startsWith(`${name}/src/app/`));
  if (!app || !/\/(?:page|route)\.[jt]sx?$/.test(path)) return null;
  const directory = posix.dirname(path).slice(`${app}/src/app`.length);
  const segments = directory.split('/').filter(x => x && !/^\(.*\)$/.test(x) && !x.startsWith('@'));
  return { app, url: '/' + segments.join('/'), type: posix.basename(path).startsWith('route.') ? 'api' : 'page', file: path };
}
function addReason(map, path, reason) { if (!map.has(path)) map.set(path, new Set()); map.get(path).add(reason); }

export async function scanRepository(root = repoRoot) {
  root = resolve(root);
  const paths = await listRepoFiles(root);
  const files = new Set(paths);
  const source = new Map();
  for (const path of paths) {
    if (textExtensions.has(extname(path)) || ['package.json', 'README.md'].includes(posix.basename(path))) {
      const data = await readFile(join(root, path), 'utf8');
      if (data.length < 2_000_000) source.set(path, data);
    }
  }
  const packages = new Map();
  for (const path of paths.filter(p => /(?:^|\/)package\.json$/.test(p))) {
    try {
      const pkg = JSON.parse(source.get(path) || '{}');
      if (pkg.name) packages.set(pkg.name, { root: posix.dirname(path), exports: pkg.exports, main: pkg.main });
    } catch { /* syntax errors belong to JSON validation, not orphan scan */ }
  }
  const packageExports = new Set();
  for (const info of packages.values()) {
    const entries = typeof info.exports === 'string' ? [info.exports] : Object.values(info.exports || {});
    for (const entry of entries) if (typeof entry === 'string') packageExports.add(posix.normalize(`${info.root}/${entry}`));
    if (typeof info.main === 'string') packageExports.add(posix.normalize(`${info.root}/${info.main}`));
  }
  const incoming = new Map();
  const unresolvedRelative = [];
  for (const [path, data] of source) {
    if (!codeExtensions.has(extname(path))) continue;
    for (const spec of moduleSpecs(data)) {
      if (!spec.startsWith('.') && !spec.startsWith('@/') && ![...packages.keys()].some(name => spec === name || spec.startsWith(name + '/'))) continue;
      const target = resolveModule(path, spec, files, packages);
      if (target) addReason(incoming, target, path);
      else if ((spec.startsWith('.') || spec.startsWith('@/')) && !path.startsWith('tests/') && !path.includes('/tests/') && !path.endsWith('next-env.d.ts') && !path.endsWith('audit-unused.mjs')) unresolvedRelative.push({ importer: path, spec });
    }
  }
  // String/path references in manifests, scripts, configs and docs can also activate
  // entrypoints via spawn(), imports through unknown aliases, build systems, etc.
  const explicit = new Map();
  // Documentation and generated audit reports can *mention* an orphan without
  // using it. Never count Markdown path mentions as a source-code reference.
  const literalRefs = [...source].filter(([path]) => !path.includes('/src/app/') && !path.endsWith('package-lock.json') && !/\.(?:md|mdx)$/.test(path));
  for (const path of paths) {
    if (!codeExtensions.has(extname(path))) continue;
    const shortened = path.startsWith('scripts/') ? posix.basename(path) : path.replace(/^(web-(?:admin|client|shipper))\//, '');
    for (const [referrer, data] of literalRefs) {
      if (referrer === path || referrer.endsWith('.test.mjs') && data.includes(path) && path.startsWith('tests/')) continue;
      if (data.includes(path) || (shortened !== path && data.includes(shortened))) addReason(explicit, path, referrer);
    }
  }
  const candidates = [];
  for (const path of paths) {
    if (!codeExtensions.has(extname(path)) || isEntry(path) || packageExports.has(path) || path.endsWith('.d.ts') || path.endsWith('.d.mts')) continue;
    const referrers = [...(incoming.get(path) || [])];
    const literal = [...(explicit.get(path) || [])];
    if (referrers.length || literal.length) continue;
    let category = 'module-review';
    if (path.startsWith('scripts/')) category = 'manual-script-review';
    if (path.startsWith('packages/')) category = 'package-export-or-dynamic-review';
    candidates.push({ path, category, decision: 'REVIEW_ONLY', reason: 'No static import or literal file-path reference detected; dynamic runtime usage is possible' });
  }
  const routes = paths.map(routeInfo).filter(Boolean);
  const routeBuckets = new Map();
  for (const route of routes) {
    const key = `${route.app}:${route.url}`;
    if (!routeBuckets.has(key)) routeBuckets.set(key, []);
    routeBuckets.get(key).push(route);
  }
  const collisions = [...routeBuckets].filter(([, group]) => group.length > 1).map(([key, group]) => ({ key, files: group.map(item => item.file) }));
  const pkg = JSON.parse(source.get('package.json') || '{}');
  const registered = new Set(Object.keys(pkg.scripts || {}));
  const staleCommands = [];
  const missingMarkdownLinks = [];
  for (const [path, data] of source) {
    if (!/\.(?:md|mdx|yml|yaml|ps1)$/.test(path) || path.includes('/src/app/') || path.startsWith('tests/')) continue;
    const lines = data.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      for (const match of line.matchAll(/\bnpm\s+run\s+([a-z][a-z0-9:.-]*)/gi)) {
        const cmd = match[1];
        const ws = line.match(/\s(?:-w|--workspace)(?:\s+|=)(web-(?:admin|client|shipper))/);
        let workspaceRegistered = false;
        if (ws) {
          const pkgPath = `${ws[1]}/package.json`;
          try { workspaceRegistered = Object.hasOwn(JSON.parse(source.get(pkgPath) || '{}').scripts || {}, cmd); } catch { /* incomplete fixture */ }
        }
        if (!registered.has(cmd) && !workspaceRegistered) staleCommands.push({ file: path, line: index + 1, command: cmd });
      }
      if (!/\.(?:md|mdx)$/.test(path)) continue;
      for (const match of line.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const link = match[1].split('#')[0].split('?')[0];
        if (!link || link.startsWith('#') || link.startsWith('/') || /^(?:https?:|mailto:|data:)/i.test(link)) continue;
        const dest = posix.normalize(posix.join(posix.dirname(path), link));
        if (!files.has(dest) && !paths.some(file => file.startsWith(dest + '/'))) missingMarkdownLinks.push({ file: path, line: index + 1, target: link });
      }
    }
  }
  const hashGroups = new Map();
  for (const [path, data] of source) {
    if (!codeExtensions.has(extname(path)) || data.trim().length < 80) continue;
    const hash = createHash('sha256').update(data).digest('hex');
    if (!hashGroups.has(hash)) hashGroups.set(hash, []);
    hashGroups.get(hash).push(path);
  }
  const exactDuplicates = [...hashGroups.values()].filter(group => group.length > 1);
  return {
    schemaVersion: 1,
    caution: 'READ ONLY: no imported reference is not proof a file is unused; do not delete routes, migrations, assets, configuration or scripts based on this report alone.',
    counts: { totalFiles: paths.length, codeFiles: paths.filter(p => codeExtensions.has(extname(p))).length, routes: routes.length, candidateModules: candidates.length, unresolvedImports: unresolvedRelative.length, routeCollisions: collisions.length, staleNpmCommands: staleCommands.length, missingMarkdownLinks: missingMarkdownLinks.length, exactDuplicateGroups: exactDuplicates.length },
    candidates, unresolvedRelative, routeCollisions: collisions, staleNpmCommands: staleCommands, missingMarkdownLinks, exactDuplicates,
    protected: { nextRoutes: routes.length, migrationFiles: paths.filter(p => p.startsWith('supabase/migrations/') && p.endsWith('.sql')).length, seedFiles: paths.filter(p => /(?:^|\/)(?:seed|seeds|fixtures?)(?:\.|\/)/i.test(p)) },
  };
}

const isDirect = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  const report = await scanRepository(repoRoot);
  const destination = resolve(repoRoot, 'artifacts/audits/unused-files.json');
  if (!process.argv.includes('--no-write')) {
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(`[GreenPlus] Read-only inventory: ${report.counts.totalFiles} files; ${report.counts.codeFiles} source modules; ${report.counts.routes} Next routes.`);
  console.log(`[GreenPlus] Review only: ${report.counts.candidateModules} possible orphan modules; ${report.counts.unresolvedImports} unresolved static imports; ${report.counts.routeCollisions} route collisions; ${report.counts.staleNpmCommands} obsolete npm references; ${report.counts.missingMarkdownLinks} broken docs links; ${report.counts.exactDuplicateGroups} identical code groups.`);
  for (const item of report.candidates.slice(0, 30)) console.log(`  REVIEW ${item.path} [${item.category}]`);
  if (report.candidates.length > 30) console.log(`  ... and ${report.candidates.length - 30} more review candidates.`);
  for (const item of report.routeCollisions.slice(0, 12)) console.log(`  ROUTE-CONFLICT ${item.key}: ${item.files.join(', ')}`);
  for (const item of report.staleNpmCommands.slice(0, 15)) console.log(`  STALE-COMMAND ${item.file}: npm run ${item.command}`);
  for (const item of report.missingMarkdownLinks.slice(0, 12)) console.log(`  BROKEN-DOC-LINK ${item.file}:${item.line} -> ${item.target}`);
  console.log(!process.argv.includes('--no-write') ? `[GreenPlus] Detailed report (no source changed): ${destination}` : '[GreenPlus] No files written (--no-write).');
  if (process.argv.includes('--strict') && (report.routeCollisions.length || report.staleNpmCommands.length || report.missingMarkdownLinks.length)) process.exitCode = 1;
}
