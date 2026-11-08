import test from 'node:test';
import assert from 'node:assert/strict';
import { dockerGatewayConfiguration, fetchDockerGateway, dockerGatewayReadiness, DockerGatewayError } from '../web-admin/backend/core/docker-gateway.mjs';
import { readFileSync } from 'node:fs';

const key = 's'.repeat(48);
const local = {
  GREENPLUS_TENANCY_DEMO: 'true',
  GREENPLUS_DOCKER_GATEWAY_KEY: key,
  GREENPLUS_DOCKER_GATEWAY_URL: 'http://127.0.0.1:4100',
};
const remote = {
  ...local,
  GREENPLUS_DOCKER_GATEWAY_URL: 'https://docker-greenplus.example.org',
  GREENPLUS_DOCKER_GATEWAY_HOST: 'docker-greenplus.example.org',
  GREENPLUS_DOCKER_REMOTE_ENABLED: 'true',
  GREENPLUS_DOCKER_ACCESS_CLIENT_ID: 'service-id',
  GREENPLUS_DOCKER_ACCESS_CLIENT_SECRET: 'service-secret',
  VERCEL: '1',
};

test('Docker switch fails closed when demo flag, URL or strong gateway key is missing', () => {
  assert.equal(dockerGatewayConfiguration({ ...local, GREENPLUS_TENANCY_DEMO: 'false' }).configured, false);
  assert.equal(dockerGatewayConfiguration({ ...local, GREENPLUS_DOCKER_GATEWAY_KEY: 'short' }).configured, false);
  assert.equal(dockerGatewayConfiguration({ ...local, GREENPLUS_DOCKER_GATEWAY_URL: undefined }).configured, false);
});

test('local Docker mode is allowed only on the same host, never Vercel', () => {
  assert.equal(dockerGatewayConfiguration(local).mode, 'local');
  assert.equal(dockerGatewayConfiguration({ ...local, VERCEL: '1' }).configured, false);
  assert.equal(dockerGatewayConfiguration({ ...local, GREENPLUS_DOCKER_GATEWAY_URL: 'http://192.168.1.5:4100' }).configured, false);
});

test('remote Docker requires HTTPS, explicit hostname allowlist and Cloudflare Access credentials', () => {
  assert.equal(dockerGatewayConfiguration(remote).mode, 'remote');
  for (const bad of [
    { GREENPLUS_DOCKER_REMOTE_ENABLED: 'false' },
    { GREENPLUS_DOCKER_GATEWAY_HOST: 'other.example.org' },
    { GREENPLUS_DOCKER_ACCESS_CLIENT_SECRET: '' },
    { GREENPLUS_DOCKER_GATEWAY_URL: 'http://docker-greenplus.example.org' },
    { GREENPLUS_DOCKER_GATEWAY_URL: 'https://docker-greenplus.example.org/admin' },
    { GREENPLUS_DOCKER_GATEWAY_URL: 'https://user:pass@docker-greenplus.example.org' },
    { GREENPLUS_DOCKER_GATEWAY_URL: 'https://docker-greenplus.example.org?token=secret' },
    { GREENPLUS_DOCKER_GATEWAY_URL: 'https://localhost' },
  ]) assert.equal(dockerGatewayConfiguration({ ...remote, ...bad }).configured, false, JSON.stringify(bad));
});

test('gateway transport sends server-only key and Access token to allowlisted host, with no redirects', async () => {
  let seen;
  const mock = async (url, init) => {
    seen = { url: String(url), init };
    return new Response(JSON.stringify({ items: [{ store_id: 'test-id' }] }), { status: 200 });
  };
  const result = await fetchDockerGateway('/stores', {}, remote, mock);
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.items, [{ store_id: 'test-id' }]);
  assert.equal(seen.url, `${remote.GREENPLUS_DOCKER_GATEWAY_URL}/stores`);
  assert.equal(seen.init.headers['x-demo-gateway-key'], key);
  assert.equal(seen.init.headers['CF-Access-Client-Id'], 'service-id');
  assert.equal(seen.init.headers['CF-Access-Client-Secret'], 'service-secret');
  assert.equal(seen.init.redirect, 'error');
  assert.equal(seen.init.cache, 'no-store');
});

test('URL path traversal and host override never transmit the gateway secret', async () => {
  let called = false;
  const stub = async () => { called = true; throw Error('should never fetch'); };
  for (const path of ['//evil.com/steal', 'https://evil.com/', '\\evil', '/stores#fragment']) {
    await assert.rejects(fetchDockerGateway(path, {}, remote, stub), DockerGatewayError);
  }
  assert.equal(called, false);
});

test('readiness requires actual HTTP 200 plus ready state, not merely an env variable', async () => {
  for (const [status, data] of [[200, { status: 'ready' }], [200, { status: 'ok' }], [503, { status: 'unavailable' }], [401, { error: 'invalid token' }]]) {
    const probe = await dockerGatewayReadiness(local, async (url) => new URL(url).pathname === '/stores'
      ? new Response(JSON.stringify({items:[]}))
      : new Response(JSON.stringify(data), { status }));
    assert.equal(probe.ready, status === 200 && data.status === 'ready');
  }
  assert.equal((await dockerGatewayReadiness(local, async () => { throw Error('unreachable'); })).ready, false);
  const wrongKey = await dockerGatewayReadiness(local, async (url) => new URL(url).pathname === '/stores'
    ? new Response(JSON.stringify({error:'Unauthorized'}), {status:401})
    : new Response(JSON.stringify({status:'ready'})));
  assert.equal(wrongKey.ready, false, 'a healthy backend must not enable the switch with an invalid gateway key');
});

test('gateway errors do not reveal backend hostname or credential information', async () => {
  await assert.rejects(fetchDockerGateway('/stores', {}, remote, async () => { throw Error('secret service-id leaked'); }),
    (error) => error instanceof DockerGatewayError && !/secret|service-id|example.org/.test(error.message));
});

test('Admin store page selects Docker tenant provisioning, never writes Docker stores into Supabase', () => {
  const page = readFileSync(new URL('../web-admin/src/app/settings/stores/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /greenplus_admin_storage_view/);
  assert.match(page, /DockerTenantStoreManagement/);
  assert.match(page, /StoreManagement/);
  const route = readFileSync(new URL('../web-admin/src/app/api/tenant-demo/route.ts', import.meta.url), 'utf8');
  assert.match(route, /actor\.role !== "admin"/);
  assert.match(route, /greenplus_admin_storage_view/);
  assert.match(route, /fetchDockerGateway/);
  assert.doesNotMatch(route, /service_role|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_DOCKER/);
});

test('main CI probes real remote Docker tenancy only when explicitly enabled', () => {
  const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(ci, /name: Docker Gateway CI/);
  assert.match(ci, /vars\.GREENPLUS_DOCKER_REMOTE_ENABLED == 'true'/);
  assert.match(ci, /node scripts\/ci\/check-docker-tenants\.mjs/);
  assert.match(ci, /GREENPLUS_DOCKER_GATEWAY_KEY: \$\{\{ secrets\.GREENPLUS_DOCKER_GATEWAY_KEY \}\}/);
  assert.match(ci, /GREENPLUS_DOCKER_ACCESS_CLIENT_SECRET: \$\{\{ secrets\.GREENPLUS_DOCKER_ACCESS_CLIENT_SECRET \}\}/);
});
