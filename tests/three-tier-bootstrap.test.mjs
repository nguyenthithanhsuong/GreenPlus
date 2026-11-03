import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url),'utf8');
test('gateway has distinct live and upstream-ready probes',()=>{
 const s=read('../docker/three-tier/gateway/server.mjs');
 assert.match(s,/path === "\/health"/);
 assert.match(s,/path === "\/ready"/);
 assert.match(s,/Promise\.allSettled/);
 assert.match(s,/checks\.every/);
});
test('compose gateway readiness healthcheck remains loopback-only',()=>{
 const s=read('../docker/three-tier/compose.yaml');
 assert.match(s,/127\.0\.0\.1:4100:4100/);
 assert.match(s,/fetch\('http:\/\/127\.0\.0\.1:4100\/ready'\)/);
});
test('bootstrap refuses to overwrite existing credentials and preserves volumes',()=>{
 const s=read('../scripts/three-tier-docker.mjs');
 assert.match(s,/if \(existsSync\(envFile\)\)/);
 assert.match(s,/flag:'wx'/);
 assert.match(s,/\['down'\]/);
 assert.doesNotMatch(s,/\['down',\s*'-v'\]/);
});
