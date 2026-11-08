import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { dockerGatewayConfiguration } from '../web-admin/backend/core/docker-gateway.mjs';
import { parseEnv, mergeAdminEnv, localDockerSettings, connectLocalAdmin } from '../scripts/three-tier-connect-admin.mjs';

const secret = 'test-gateway-key-' + 'K'.repeat(55);
const dockerText = `DEMO_POSTGRES_PASSWORD=not-used\nDEMO_GATEWAY_KEY=${secret}\nDEMO_POSTGREST_PASSWORD=not-used\n`;
const fakeReady = async (url, options = {}) => {
  const path = new URL(url).pathname;
  if (path === '/ready') return new Response(JSON.stringify({ status: 'ready' }), { status: 200 });
  if (path === '/stores') {
    assert.equal(options.headers['x-demo-gateway-key'], secret, 'real gateway key must be sent server-side');
    return new Response(JSON.stringify({ items: [{ store_id:'a' }, { store_id:'b' }] }), { status: 200 });
  }
  throw Error('Unexpected endpoint');
};
const sandbox = () => {
  const root = mkdtempSync(resolve(tmpdir(), 'greenplus-bridge-'));
  mkdirSync(resolve(root, 'docker/three-tier'), { recursive: true });
  mkdirSync(resolve(root, 'web-admin'), { recursive: true });
  writeFileSync(resolve(root, 'docker/three-tier/.env'), dockerText);
  return root;
};

test('safe local settings derive key solely from Docker, not root or browser env', () => {
  const config = localDockerSettings(dockerText);
  assert.equal(config.GREENPLUS_TENANCY_DEMO, 'true');
  assert.equal(config.GREENPLUS_DOCKER_GATEWAY_URL, 'http://127.0.0.1:4100');
  assert.equal(config.GREENPLUS_DOCKER_GATEWAY_KEY, secret);
  assert.equal(dockerGatewayConfiguration(config).mode, 'local');
  assert.throws(() => localDockerSettings('DEMO_GATEWAY_KEY=short'), /gateway secret/);
});

test('Admin env merge preserves unrelated settings, overwrites stale local key, and is idempotent', () => {
  const settings = localDockerSettings(dockerText);
  const previous = 'AUTH_HANDOFF_SECRET=KEEP_ME\r\nNEXT_PUBLIC_SUPABASE_URL=https://example.org\r\nGREENPLUS_TENANCY_DEMO=false\r\nGREENPLUS_DOCKER_GATEWAY_KEY=OLD_KEY\r\n';
  const once = mergeAdminEnv(previous, settings);
  const twice = mergeAdminEnv(once, settings);
  assert.equal(once, twice);
  assert.equal((once.match(/GREENPLUS_DOCKER_GATEWAY_KEY=/g) || []).length, 1);
  assert.match(once, /AUTH_HANDOFF_SECRET=KEEP_ME/);
  assert.match(once, /NEXT_PUBLIC_SUPABASE_URL=https:\/\/example.org/);
  assert.equal(parseEnv(once).GREENPLUS_DOCKER_GATEWAY_KEY, secret);
  assert.equal(once.includes('\r\n'), true);
});

test('Connect & check work with real workspace files, do not touch Docker .env or unrelated config', async () => {
  const root = sandbox();
  try {
    const adminPath = resolve(root,'web-admin/.env.local');
    writeFileSync(adminPath, 'AUTH_HANDOFF_SECRET=keep_me\n');
    const originalDocker = readFileSync(resolve(root,'docker/three-tier/.env'),'utf8');
    const linked = await connectLocalAdmin({ root, fetcher: fakeReady });
    assert.equal(linked.changed,true);
    const first = readFileSync(adminPath,'utf8');
    assert.equal(parseEnv(first).GREENPLUS_DOCKER_GATEWAY_KEY, secret);
    assert.match(first, /AUTH_HANDOFF_SECRET=keep_me/);
    assert.equal((await connectLocalAdmin({root,checkOnly:true,fetcher:fakeReady})).ready,true);
    assert.equal((await connectLocalAdmin({root,fetcher:fakeReady})).changed,false);
    assert.equal(readFileSync(adminPath,'utf8'),first);
    assert.equal(readFileSync(resolve(root,'docker/three-tier/.env'),'utf8'),originalDocker);
  } finally { rmSync(root, { recursive:true,force:true }); }
});

test('Authentication 401 prevents env writes and preserves existing admin secrets', async () => {
  const root = sandbox();
  try {
    const admin = resolve(root,'web-admin/.env.local');
    writeFileSync(admin,'AUTH_HANDOFF_SECRET=UNCHANGED\n');
    await assert.rejects(connectLocalAdmin({root,fetcher: async url => new URL(url).pathname === '/ready'
      ? new Response(JSON.stringify({status:'ready'}))
      : new Response(JSON.stringify({error:'Unauthorized'}),{status:401})}), /not ready\/authenticated/);
    assert.equal(readFileSync(admin,'utf8'),'AUTH_HANDOFF_SECRET=UNCHANGED\n');
  } finally { rmSync(root, { recursive:true,force:true }); }
});

test('Existing remote gateway config is never silently overwritten with localhost', async () => {
  const root = sandbox();
  try {
    const admin = resolve(root,'web-admin/.env.local');
    const remote = 'GREENPLUS_DOCKER_GATEWAY_URL=https://staging.example.org\nAUTH_HANDOFF_SECRET=KEEP\n';
    writeFileSync(admin,remote);
    await assert.rejects(connectLocalAdmin({root,fetcher:fakeReady}), /refusing to overwrite/);
    assert.equal(readFileSync(admin,'utf8'),remote);
    assert.equal((await connectLocalAdmin({root,fetcher:fakeReady,forceLocal:true})).changed,true);
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('Internal Docker bridge is exact-host, opt-in, never allowed on Vercel or LAN', () => {
  const base = { GREENPLUS_TENANCY_DEMO:'true',GREENPLUS_DOCKER_GATEWAY_KEY:secret,
    GREENPLUS_DOCKER_GATEWAY_URL:'http://gateway:4100' };
  assert.equal(dockerGatewayConfiguration(base).configured,false);
  assert.equal(dockerGatewayConfiguration({...base,GREENPLUS_DOCKER_INTERNAL_ENABLED:'true'}).mode,'internal');
  for (const override of [
    {VERCEL:'1'}, {GREENPLUS_DOCKER_GATEWAY_URL:'http://192.168.1.2:4100'},
    {GREENPLUS_DOCKER_GATEWAY_URL:'http://gateway:4101'},
    {GREENPLUS_DOCKER_GATEWAY_URL:'http://gateway.local:4100'},
    {GREENPLUS_DOCKER_GATEWAY_URL:'http://gateway:4100/evil'},
  ]) assert.equal(dockerGatewayConfiguration({...base,GREENPLUS_DOCKER_INTERNAL_ENABLED:'true',...override}).configured,false);
});

test('Optional full Docker web stack bridges Admin privately without exposing Postgres or gateway keys', () => {
  const root=resolve(import.meta.dirname,'..');
  const override = readFileSync(resolve(root,'docker-compose.three-tier.yml'),'utf8');
  const appstack = readFileSync(resolve(root,'scripts/three-tier-app-stack.mjs'),'utf8');
  const wrapper=readFileSync(resolve(root,'scripts/dev-with-docker.mjs'),'utf8');
  const upScript=readFileSync(resolve(root,'scripts/three-tier-docker.mjs'),'utf8');
  const ui=readFileSync(resolve(root,'web-admin/frontend/settings/StorageModeSetting.tsx'),'utf8');
  assert.match(override, /name: greenplus-three-tier_default/);
  assert.match(override, /external: true/);
  assert.match(override, /GREENPLUS_DOCKER_INTERNAL_ENABLED: "true"/);
  assert.match(override, /http:\/\/gateway:4100/);
  assert.doesNotMatch(override, /ports:|SUPABASE_SERVICE_ROLE_KEY|5432:5432/);
  assert.match(appstack, /check-docker-container-gateway\.mjs/);
  assert.doesNotMatch(appstack,/down.*--volumes/);
  assert.match(wrapper,/connectLocalAdmin\(/);
  assert.match(upScript,/await connectLocalAdmin\(/);
  assert.match(ui, /Kiểm tra lại kết nối Docker/);
  assert.match(ui, /role="switch"/);
});
