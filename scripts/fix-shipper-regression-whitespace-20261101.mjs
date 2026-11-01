#!/usr/bin/env node
// Patch ONLY stale whitespace-sensitive assertions in GreenPlus Shipper tests.
// No application, database, Docker, or environment files are touched.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = [
  {
    file: 'web-shipper/tests/shipper-ui-consistency.test.mjs',
    changes: [
      {
        label: 'JSX ShipperShell opening tag',
        before: String.raw`/<ShipperShell /`,
        after: String.raw`/<ShipperShell\s/`,
      },
      {
        label: 'JSX Modal opening tag',
        before: String.raw`/<Modal /`,
        after: String.raw`/<Modal\s/`,
      },
    ],
  },
  {
    file: 'web-shipper/tests/map-helpers.test.mjs',
    changes: [
      {
        label: 'databasePoint real destination coordinate assertion',
        before: String.raw`/const dropoff = databasePoint\(row\.orders\?\.delivery_latitude, row\.orders\?\.delivery_longitude\)/`,
        after: String.raw`/const\s+dropoff\s*=\s*databasePoint\(\s*row\.orders\?\.delivery_latitude\s*,\s*row\.orders\?\.delivery_longitude\s*,?\s*\)/`,
      },
    ],
  },
];

function patchContent(src, changes, file) {
  let updated = src;
  for (const { before, after, label } of changes) {
    const oldCount = updated.split(before).length - 1;
    const newCount = updated.split(after).length - 1;
    if (oldCount === 0 && newCount === 1) continue; // idempotent
    if (oldCount !== 1 || newCount !== 0) {
      throw new Error(`${file}: ambiguous/missing assertion (${label}). No files modified; inspect manually.`);
    }
    updated = updated.replace(before, after);
  }
  return updated;
}

function run() {
  const flags = process.argv.slice(2);
  if (flags.length !== 1 || !['--check', '--apply'].includes(flags[0])) {
    throw new Error('Usage: node scripts/fix-shipper-regression-whitespace-20261101.mjs --check | --apply');
  }
  if (!existsSync('web-shipper/package.json')) throw new Error('Run from GreenPlus monorepo root.');
  const pending = targets.map(({ file, changes }) => {
    const absolute = resolve(file);
    if (!existsSync(absolute)) throw new Error(`Required test file missing: ${file}`);
    const src = readFileSync(absolute, 'utf8');
    const updated = patchContent(src, changes, file);
    return { file, absolute, src, updated };
  });
  // All guards have succeeded. Only now begin writing if requested.
  for (const { file, absolute, src, updated } of pending) {
    const changed = src !== updated;
    if (flags[0] === '--apply' && changed) writeFileSync(absolute, updated, 'utf8');
    process.stdout.write(`${changed ? (flags[0] === '--apply' ? 'PATCHED' : 'WOULD PATCH') : 'ALREADY OK'} ${file}\n`);
  }
  process.stdout.write(flags[0] === '--apply' ? 'Shipper test-only patch applied.\n' : 'Preflight passed. No files changed.\n');
}

try { run(); } catch (error) {
  console.error(`SHIPPER TEST FIX ABORTED: ${error.message}`);
  process.exitCode = 1;
}
