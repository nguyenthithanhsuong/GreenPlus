#!/usr/bin/env node
import { checkMobileRelease } from './lib/mobile-release.mjs';

// node scripts/mobile-release-check.mjs <client|shipper> <https://site> [--twa] [--package=com.example.app]
const [app, site, ...flags] = process.argv.slice(2);
if (!app || !site || flags.some(f => f !== '--twa' && !f.startsWith('--package='))) {
  console.error('Usage: node scripts/mobile-release-check.mjs <client|shipper> <https://production-origin> [--twa] [--package=android.app.id]');
  process.exit(2);
}
try {
  const packageFlag = flags.find(f => f.startsWith('--package='));
  const result = await checkMobileRelease(site, {
    app, twa: flags.includes('--twa'),
    ...(packageFlag ? {packageName:packageFlag.slice('--package='.length)} : {}),
  });
  console.log(`PASS ${result.app} ${result.origin}: manifest, PNG icons, uncached service worker, offline shell${result.twa ? `, verified asset links for ${result.packageName}` : ''}`);
  console.log('NOTE: Actual Android/iOS install, login, camera and GPS permissions require device acceptance tests.');
} catch (error) {
  console.error(`FAIL ${app ?? 'unknown'} mobile release: ${error.message}`);
  process.exitCode = 1;
}
