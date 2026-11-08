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
 const wrapper=read('../scripts/three-tier-docker.mjs');
 const credentials=read('../scripts/three-tier-secrets.mjs');
 assert.match(wrapper,/ensureDockerSecrets\(envFile\)/);
 assert.match(credentials,/if \(!existsSync\(file\)\)/);
 assert.match(credentials,/flag: ["']wx["']/);
 assert.match(wrapper,/\['down'\]/);
 assert.doesNotMatch(wrapper,/\['down',\s*'-(?:v|\-volumes)'\]/);
});
