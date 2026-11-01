#!/usr/bin/env node
/**
 * Narrow, repeatable source fixes for GreenPlus CI on 2026-11-01.
 * No dependency install, no Supabase calls, no migrations, no Git operations.
 * --check: validate that each fix applies (no writes)
 * --apply: apply all file changes after all preflight checks succeed
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIX_PATHS = Object.freeze({
  clientTest: 'web-client/tests/store-multitenancy.test.mjs',
  adminTable: 'web-admin/frontend/users/UserTable.tsx',
  adminApi: 'web-admin/src/app/api/users/route.ts',
  shipperTest: 'web-shipper/tests/shipper-ui-consistency.test.mjs',
  shipperLogin: 'web-shipper/src/app/login/page.tsx',
  shipperCss: 'web-shipper/src/app/login/login.module.css',
});

function fail(message) {
  throw new Error(message);
}

export function clientTestFix(text) {
  const before = text;
  // Some GreenPlus branches use an already-renamed variable or a different
  // test loader. Only modify the actual forbidden local binding; do not demand
  // an exact loadTs() body or spacing.
  const declarations = [...text.matchAll(/\b(?:const|let|var)\s+module\b/g)];
  if (declarations.length === 0) return { text, changed: false };
  if (declarations.length !== 1) {
    fail('Client test: multiple local variables named module; manual review required.');
  }

  const declaration = /\b(const|let|var)(\s+)module(?=\s*=\s*\{\s*exports\s*:\s*\{\s*\}\s*\})/;
  if (!declaration.test(text)) {
    fail('Client test: unexpected local module declaration; cannot rename it safely.');
  }
  if (/\b(?:const|let|var)\s+testModule\b/.test(text)) {
    fail('Client test: testModule already exists; would cause a duplicate binding.');
  }
  if (!/\bmodule\s*,\s*module\s*\.\s*exports\b/.test(text) ||
      !/\breturn\s+module\s*\.\s*exports\b/.test(text)) {
    fail('Client test: unexpected CommonJS module references; manual review required.');
  }

  text = text.replace(declaration, (_full, keyword, spacing) => `${keyword}${spacing}testModule`);
  text = text.replace(/\bmodule\s*,\s*module\s*\.\s*exports\b/g,
    'testModule, testModule.exports');
  text = text.replace(/\breturn\s+module\s*\.\s*exports\b/g,
    'return testModule.exports');

  // Intentionally leave string literals such as `(function(module, exports, ...)`
  // unchanged: the VM's CommonJS argument name is not a local source binding.
  return { text, changed: text !== before };
}

function adminTableFix(text) {
  const before = text;
  const typeStart = text.indexOf('export type UserViewModel = {');
  if (typeStart < 0) fail('Admin Table: UserViewModel type not found.');
  const typeEnd = text.indexOf('\n};', typeStart);
  if (typeEnd < 0) fail('Admin Table: UserViewModel end not found.');
  const model = text.slice(typeStart, typeEnd);
  if (!model.includes('store_id: string | null;')) fail('Admin Table: expected store_id property not found.');
  if (!model.includes('store_ids?: string[];')) {
    const insertAt = typeStart + model.indexOf('store_id: string | null;') + 'store_id: string | null;'.length;
    text = text.slice(0, insertAt) + '\n  store_ids?: string[];' + text.slice(insertAt);
  }
  // asPortalRole() can return null during auth/session hydration.
  if (text.includes('portalRole: string;')) text = text.replace('portalRole: string;', 'portalRole: string | null;');
  else if (!text.includes('portalRole: string | null;')) fail('Admin Table: portalRole props type differs from expected.');

  if (text.includes('.map((store) => storeNameById.get(store) ?? store)')) {
    text = text.replace('.map((store) => storeNameById.get(store) ?? store)',
      '.map((store: string) => storeNameById.get(store) ?? store)');
  } else if (!text.includes('.map((store: string) => storeNameById.get(store) ?? store)')) {
    fail('Admin Table: store-name mapping expression differs from expected; inspect manually.');
  }
  return { text, changed: text !== before };
}

function adminApiFix(text) {
  const before = text;
  // `select(columns)` with a runtime string yields GenericStringError[] in newer
  // supabase-js typings. The columns and target tables are controlled by the server.
  const old = /rows\.push\(\.\.\.\(\(data \?\? \[\]\) as Array<Record<string, string>>\)\);/;
  if (old.test(text)) {
    text = text.replace(old,
      'rows.push(...((data ?? []) as unknown as Array<Record<string, string>>));');
  } else if (!text.includes('rows.push(...((data ?? []) as unknown as Array<Record<string, string>>));')) {
    fail('Admin API: known Supabase dynamic-select cast not found; do not overwrite this route.');
  }
  return { text, changed: text !== before };
}

const updatedShipperTest = `test('login feedback is accessible and inputs stay in the scoped mobile layout', () => {
  const login = source('../src/app/login/page.tsx');
  const css = source('../src/app/login/login.module.css');
  assert.match(login, /role="alert"/);
  assert.match(login, /className=\\{styles\\.alert\\}/);
  assert.match(login, /className=\\{styles\\.field\\}/);
  assert.match(login, /import styles from "\\.\\/login\\.module\\.css"/);
  assert.match(css, /\\.field\\s*\\{[^}]*display:\\s*flex/s);
  assert.match(css, /\\.input\\s*\\{[^}]*min-width:\\s*0/s);
  assert.doesNotMatch(login, /h-\\[84px\\]/);
});`;

function shipperTestFix(text) {
  const before = text;
  const obsolete = /test\('login feedback space remains stable and is announced accessibly', \(\) => \{[\s\S]*?\n\}\);/;
  if (obsolete.test(text)) {
    text = text.replace(obsolete, updatedShipperTest);
  } else if (!text.includes("login feedback is accessible and inputs stay in the scoped mobile layout")) {
    fail('Shipper test: old test block absent; inspect file before changing.');
  }
  return { text, changed: text !== before };
}

export const FIXES = Object.freeze([
  ['clientTest', clientTestFix],
  ['adminTable', adminTableFix],
  ['adminApi', adminApiFix],
  ['shipperTest', shipperTestFix],
]);

export function prepare(root) {
  const preflight = [FIX_PATHS.shipperLogin, FIX_PATHS.shipperCss];
  for (const name of preflight) {
    if (!existsSync(resolve(root, name))) fail(`Missing Shipper login CSS-module source: ${name}. Apply the Nov 1 login rebuild first.`);
  }
  const files = [];
  for (const [name, transform] of FIXES) {
    const relative = FIX_PATHS[name];
    const absolute = resolve(root, relative);
    if (!existsSync(absolute)) fail(`Missing target file: ${relative}`);
    const source = readFileSync(absolute, 'utf8');
    const result = transform(source);
    files.push({ path: relative, absolute, ...result });
  }
  // Validate latest Shipper layout before accepting the replacement test.
  const login = readFileSync(resolve(root, FIX_PATHS.shipperLogin), 'utf8');
  const css = readFileSync(resolve(root, FIX_PATHS.shipperCss), 'utf8');
  if (!login.includes('import styles from "./login.module.css"') ||
      !login.includes('role="alert"') ||
      !css.includes('.field') || !css.includes('display: flex;')) {
    fail('Shipper login is not the CSS-module rebuild assumed by this patch.');
  }
  return files;
}

function run() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--help')) {
    process.stdout.write('Usage: node scripts/apply-greenplus-ci-fixes-20261101.mjs [--check|--apply]\n');
    return;
  }
  if ((args.has('--check') && args.has('--apply')) ||
      (![...args].every((arg) => ['--check', '--apply'].includes(arg)))) {
    fail('Use exactly --check or --apply.');
  }
  const isApply = args.has('--apply');
  const root = process.cwd();
  if (!existsSync(resolve(root, 'web-admin/package.json')) ||
      !existsSync(resolve(root, 'web-client/package.json')) ||
      !existsSync(resolve(root, 'web-shipper/package.json'))) {
    fail('Run from GreenPlus monorepo root (web-admin, web-client and web-shipper must exist).');
  }
  const files = prepare(root); // Validate every target BEFORE writing anything.
  for (const file of files) {
    if (isApply && file.changed) writeFileSync(file.absolute, file.text, 'utf8');
    process.stdout.write(`${file.changed ? isApply ? 'PATCHED' : 'WILL PATCH' : 'ALREADY OK'}  ${file.path}\n`);
  }
  process.stdout.write(isApply ? 'Finished applying CI fixes. Run the CI commands.\n' : 'Preflight passed; no files were modified.\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try { run(); } catch (error) { process.stderr.write(`CI FIX ABORTED: ${error.message}\n`); process.exitCode = 1; }
}
