#!/usr/bin/env node
// Test-only patch: allow either quote style around fixed literal arguments.
// Refuses unknown layouts and preflights ALL files before making changes.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const changes = [
  {
    file: 'web-shipper/tests/delivery-api.integration.test.mjs',
    replacements: [
      { name: 'shipper role must be true', count: 1,
        before: String.raw`/\.eq\('roles\.is_shipper', true\)/`,
        after: String.raw`/\.eq\((['"])roles\.is_shipper\1,\s*true\)/` },
      { name: 'employee must own delivery', count: 1,
        before: String.raw`/\.eq\('employee_id', user\.user_id\)/`,
        after: String.raw`/\.eq\((['"])employee_id\1,\s*user\.user_id\)/` },
      { name: 'membership source', count: 1,
        before: String.raw`/\.from\('store_members'\)/`,
        after: String.raw`/\.from\((['"])store_members\1\)/` },
      { name: 'active store membership', count: 1,
        before: String.raw`/\.eq\('status', 'active'\)/`,
        after: String.raw`/\.eq\((['"])status\1,\s*(['"])active\2\)/` },
      { name: 'compare-and-swap status', count: 1,
        before: String.raw`/\.eq\('status', currentStatus\)/`,
        after: String.raw`/\.eq\((['"])status\1,\s*currentStatus\)/` },
    ],
  },
  {
    file: 'web-shipper/tests/map-helpers.test.mjs',
    replacements: [
      { name: 'map/delivery employee ownership', count: 2,
        before: String.raw`/\.eq\('employee_id', user\.user_id\)/`,
        after: String.raw`/\.eq\((['"])employee_id\1,\s*user\.user_id\)/` },
      { name: 'OSRM demo blocked outside development', count: 1,
        before: String.raw`/process\.env\.NODE_ENV !== 'development'/`,
        after: String.raw`/process\.env\.NODE_ENV\s*!==\s*(['"])development\1/` },
      { name: 'OSRM demo checks request origin', count: 1,
        before: String.raw`/get\('origin'\)/`,
        after: String.raw`/get\((['"])origin\1\)/` },
    ],
  },
];

function occurrences(value, token) {
  return value.split(token).length - 1;
}

function patch(source, target) {
  let result = source;
  for (const item of target.replacements) {
    const oldCount = occurrences(result, item.before);
    const newCount = occurrences(result, item.after);
    if (newCount === item.count && oldCount === 0) continue;
    if (oldCount !== item.count || newCount !== 0) {
      throw new Error(`${target.file}: unexpected assertion for ${item.name} (old=${oldCount}, new=${newCount}); no files changed`);
    }
    result = result.split(item.before).join(item.after);
  }
  return result;
}

function main() {
  const mode = process.argv[2];
  if (process.argv.length !== 3 || !['--check', '--apply'].includes(mode)) {
    throw new Error('Usage: node scripts/fix-shipper-test-quote-style-20261101.mjs --check | --apply');
  }
  if (!existsSync('web-shipper/package.json')) throw new Error('Run from the GreenPlus monorepo root');
  const updates = changes.map(target => {
    const path = resolve(target.file);
    if (!existsSync(path)) throw new Error(`Missing file ${target.file}`);
    const old = readFileSync(path, 'utf8');
    const next = patch(old, target);
    return {file: target.file, path, old, next};
  });
  for (const update of updates) {
    const changed = update.old !== update.next;
    if (mode === '--apply' && changed) writeFileSync(update.path, update.next, 'utf8');
    console.log(`${!changed ? 'ALREADY OK' : mode === '--check' ? 'WOULD PATCH' : 'PATCHED'} ${update.file}`);
  }
  console.log(mode === '--check' ? 'Preflight passed. No files changed.' : 'Shipper quote-style test hotfix applied.');
}

try { main(); } catch (err) {
  console.error(`SHIPPER QUOTE TEST FIX ABORTED: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
}
