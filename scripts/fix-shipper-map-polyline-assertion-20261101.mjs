#!/usr/bin/env node
// Fix only a stale multiline JSX assertion. No app source or database changes.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = 'web-shipper/tests/map-helpers.test.mjs';
const oldAssertion = String.raw`/road && road\.length > 1 && <Polyline/`;
const newAssertion = String.raw`/\{\s*road\s*&&\s*road\.length\s*>\s*1\s*&&\s*(?:\(\s*)?<Polyline\b/`;

function occurrences(source, needle) {
  return source.split(needle).length - 1;
}

function main() {
  const [mode, ...rest] = process.argv.slice(2);
  if (rest.length || !['--check', '--apply'].includes(mode)) {
    throw new Error('Usage: node scripts/fix-shipper-map-polyline-assertion-20261101.mjs --check | --apply');
  }
  if (!existsSync('web-shipper/package.json')) {
    throw new Error('Run this script from the GreenPlus monorepo root.');
  }
  const fullPath = resolve(file);
  if (!existsSync(fullPath)) throw new Error(`Missing ${file}`);
  const before = readFileSync(fullPath, 'utf8');
  const oldCount = occurrences(before, oldAssertion);
  const newCount = occurrences(before, newAssertion);
  if (oldCount === 0 && newCount === 1) {
    console.log(`ALREADY OK ${file}`);
    return;
  }
  if (oldCount !== 1 || newCount !== 0) {
    throw new Error(`Unexpected map assertion layout (old=${oldCount}, new=${newCount}). No files modified.`);
  }
  const after = before.replace(oldAssertion, newAssertion);
  if (mode === '--apply') {
    writeFileSync(fullPath, after, 'utf8');
    console.log(`PATCHED ${file}`);
  } else {
    console.log(`WOULD PATCH ${file}`);
    console.log('Preflight succeeded. No files modified.');
  }
}

try {
  main();
} catch (error) {
  console.error(`SHIPPER MAP TEST FIX ABORTED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
