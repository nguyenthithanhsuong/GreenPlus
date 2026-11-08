#!/usr/bin/env node
// Backwards-compatible deployment gate used by deploy-prod.yml.
// Uses the same strict PWA checks as scripts/mobile-release-check.mjs.
import { checkMobileRelease } from './lib/mobile-release.mjs';

const [clientOrigin, shipperOrigin, ...extra] = process.argv.slice(2);
if (!clientOrigin || !shipperOrigin || extra.length) {
  console.error('Usage: node scripts/check-pwa-deployment.mjs https://client-domain https://shipper-domain');
  process.exit(2);
}
let failures = 0;
for (const [app, origin] of [['client',clientOrigin],['shipper',shipperOrigin]]) {
  try {
    const result = await checkMobileRelease(origin, {app});
    console.log(`PASS ${result.app} ${result.origin}: HTTPS, installable manifest, PNG icons, uncached SW and offline shell`);
  } catch (error) {
    console.error(`FAIL ${app} ${origin}: ${error.message}`);
    failures++;
  }
}
if (failures) process.exitCode = 1;
console.log('NOTE: Chrome/Safari installation and Android TWA signature still require device testing.');
