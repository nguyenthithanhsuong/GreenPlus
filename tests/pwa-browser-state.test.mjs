import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

for (const app of ['web-client', 'web-shipper']) {
  test(`${app}: PWA browser state uses hydration-safe external snapshots`, () => {
    const source = readFileSync(resolve(root, app, 'src/app/PwaRegister.tsx'), 'utf8');
    assert.match(source, /useSyncExternalStore\(subscribeDisplayMode, getInstalled, getServerInstalled\)/);
    assert.match(source, /useSyncExternalStore\(subscribeOnline, getOnline, getServerOnline\)/);
    assert.match(source, /useSyncExternalStore\(subscribeStatic, getMobileBrowser, getServerMobileBrowser\)/);
    assert.match(source, /const getServerInstalled = \(\) => true/);
    assert.match(source, /const getServerOnline = \(\) => true/);
    assert.match(source, /const getServerMobileBrowser = \(\) => false/);
    assert.match(source, /window\.addEventListener\("beforeinstallprompt", handlePrompt\)/);
    assert.match(source, /window\.addEventListener\("appinstalled", handleInstalled\)/);
    assert.match(source, /window\.addEventListener\("offline", notify\)/);
    assert.match(source, /window\.addEventListener\("online", notify\)/);
    assert.doesNotMatch(source, /setMobileBrowser\(|setOnline\(|setIsInstalled\(/);
    assert.match(source, /if \(isInstalled \|\| dismissed \|\| \(!canInstall && !mobileBrowser\)\) return null/);
  });
}
