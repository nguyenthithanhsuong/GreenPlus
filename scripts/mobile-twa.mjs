#!/usr/bin/env node
// Bubblewrap wrapper for each *deployed* Next.js PWA; never publishes signing keys.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APP_IDS, checkMobileRelease, isValidPackageId, normalizeOrigin } from './lib/mobile-release.mjs';

const project = resolve(import.meta.dirname, '..');
const target = process.argv[2], action = process.argv[3];
const aliases = {client:'client-twa', shipper:'shipper-twa'};
if (!aliases[target] || !['init','build','install','assetlinks','check'].includes(action)) {
  console.error('Usage: node scripts/mobile-twa.mjs <client|shipper> <init|build|install|assetlinks|check> [https://site] [sha256]');
  process.exit(2);
}
const dir = resolve(project, 'mobile', aliases[target]);
mkdirSync(dir, { recursive: true });
const configPath = resolve(dir, 'twa-manifest.json');
function config() {
  if (!existsSync(configPath)) throw Error(`Initialize ${target} after deploying the PWA first.`);
  return JSON.parse(readFileSync(configPath, 'utf8'));
}
function androidPackage() {
  const c = config();
  const pkg = c.applicationId || c.packageId;
  if (!isValidPackageId(pkg)) throw Error('Invalid Android package ID in twa-manifest.json');
  return pkg;
}
function run(cmd, args) {
  const x = spawnSync(cmd, args, {cwd: dir, stdio: 'inherit', shell: process.platform === 'win32'});
  if (x.error) throw x.error;
  if (x.status !== 0) process.exit(x.status || 1);
}
const site = process.argv[4];
if (action === 'init') {
  const origin = normalizeOrigin(site);
  await checkMobileRelease(origin, {app: target});
  console.log(`Packaging ${target}: ${origin}/manifest.webmanifest`);
  console.log(`Use application ID ${APP_IDS[target]} and keep signing key outside Git.`);
  run('npx', ['--yes', '@bubblewrap/cli', 'init', `--manifest=${origin}/manifest.webmanifest`]);
} else if (action === 'build' || action === 'install') {
  const pkg = androidPackage();
  console.log(`Bubblewrap ${action}: ${pkg}. Verify deployed Digital Asset Links before release.`);
  run('npx', ['--yes', '@bubblewrap/cli', action]);
} else if (action === 'check') {
  const pkg = existsSync(configPath) ? androidPackage() : APP_IDS[target];
  const result = await checkMobileRelease(site, {app: target, twa: true, packageName: pkg});
  console.log(`PASS ${result.app} ${result.origin}: PWA assets and Android Digital Asset Links for ${pkg}`);
} else if (action === 'assetlinks') {
  const pkg = androidPackage();
  const sha = process.argv[5] ?? process.argv[4];
  if (!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i.test(sha ?? ''))
    throw Error('Provide SHA256 signing certificate fingerprint after assetlinks (keytool -list -v)');
  const data = [{relation:['delegate_permission/common.handle_all_urls'],
    target: {namespace:'android_app',package_name:pkg,sha256_cert_fingerprints:[sha.toUpperCase()]}}];
  const dest = resolve(dir, 'assetlinks.generated.json');
  writeFileSync(dest, JSON.stringify(data, null, 2) + '\n');
  console.log(`Generated ${dest}`);
  console.log(`Deploy package ID via GREENPLUS_TWA_${target.toUpperCase()}_PACKAGE_ID=${pkg}`);
  console.log(`Deploy public SHA256 via GREENPLUS_TWA_${target.toUpperCase()}_SHA256; then verify /.well-known/assetlinks.json`);
}
