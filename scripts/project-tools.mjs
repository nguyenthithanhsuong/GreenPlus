#!/usr/bin/env node
/**
 * Developer convenience command router. The existing Docker, Android, and
 * maintenance tools remain the single source of truth for business behavior.
 * No command runs when called without a valid, explicit action.
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [area, first, second, ...rest] = process.argv.slice(2);

const docker = {
  init: ['three-tier-docker.mjs', 'init'],
  up: ['three-tier-docker.mjs', 'up'],
  check: ['three-tier-docker.mjs', 'check'],
  down: ['three-tier-docker.mjs', 'down'],
  ps: ['three-tier-docker.mjs', 'ps'],
  'link-admin': ['three-tier-connect-admin.mjs', 'connect'],
  'check-admin': ['three-tier-connect-admin.mjs', 'check'],
  'apps:up': ['three-tier-app-stack.mjs', 'up'],
  'apps:check': ['three-tier-app-stack.mjs', 'check'],
  'apps:down': ['three-tier-app-stack.mjs', 'down'],
  'test:commerce': ['test-three-tier-commerce.mjs'],
  'test:transactions': ['test-three-tier-transactions.mjs'],
  'test:lifecycle': ['test-three-tier-lifecycle.mjs'],
};

function usage() {
  console.log(`GreenPlus project tools

  npm run docker -- <${Object.keys(docker).join('|')}>
  npm run mobile -- <client|shipper> <preflight|init|check|assetlinks|build|install> [args]
  npm run maintain -- <scan|clean|apply|restore|verify|all> [args]

Examples:
  npm run docker -- check
  npm run mobile -- client preflight https://client.example.com/
  npm run maintain -- scan

Only the requested action is run; no default database or file mutation.`);
}

let command;
if (area === 'docker' && Object.hasOwn(docker, first)) {
  const [script, ...args] = docker[first];
  command = [script, ...args, ...(second === undefined ? [] : [second, ...rest])];
} else if (area === 'mobile' && ['client', 'shipper'].includes(first)) {
  if (second === 'preflight') command = ['mobile-release-check.mjs', first, ...rest];
  else if (['init', 'check', 'assetlinks', 'build', 'install'].includes(second))
    command = ['mobile-twa.mjs', first, second, ...rest];
} else if (area === 'maintain' && ['scan', 'clean', 'apply', 'restore', 'verify', 'all'].includes(first)) {
  command = ['repo-maintenance.mjs', ...(first === 'apply' ? ['clean', '--apply'] : [first]), ...(second === undefined ? [] : [second, ...rest])];
}

if (!command) {
  usage();
  process.exitCode = process.argv.includes('--help') || process.argv.length <= 3 ? 0 : 2;
} else {
  const result = spawnSync(process.execPath, [resolve(root, 'scripts', command[0]), ...command.slice(1)], {
    cwd: root, stdio: 'inherit', windowsHide: true,
  });
  if (result.error) {
    console.error(`[GreenPlus] ${result.error.message}`);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? (result.signal ? 130 : 1);
  }
}
