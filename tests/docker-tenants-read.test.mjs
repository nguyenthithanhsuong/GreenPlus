import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyDockerTenants } from '../scripts/ci/check-docker-tenants.mjs';
const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const C = '00000000-0000-4000-8000-000000000003';
const env = { GREENPLUS_TENANCY_DEMO:'true', GREENPLUS_DOCKER_GATEWAY_KEY:'k'.repeat(40), GREENPLUS_DOCKER_GATEWAY_URL:'http://127.0.0.1:4100' };
const tenants = [ {store_id:A,tier:'regular',slot:'shared'}, {store_id:B,tier:'pro',slot:'pro_a'}, {store_id:C,tier:'enterprise',slot:'enterprise_a'} ];
const responder = (leak = false) => async (url) => {
  const path = new URL(url).pathname;
  if (path === '/ready') return new Response(JSON.stringify({status:'ready'}));
  if (path === '/stores') return new Response(JSON.stringify({items:tenants}));
  const match = /^\/stores\/([0-9a-f-]{36})\/(catalog-products|categories|inventory|orders)$/.exec(path);
  if (!match) return new Response(JSON.stringify({error:'Not found'}), {status:404});
  const storeId = leak && match[1] === B && match[2] === 'orders' ? A : match[1];
  return new Response(JSON.stringify({items:[{store_id:storeId}]}));
};
test('live gateway probe checks all three tiers across catalog, inventory and orders', async () => {
  assert.deepEqual(await verifyDockerTenants({env,fetcher:responder(), requireAllTiers:true}), {tenants:3,checks:12,tiers:['regular','pro','enterprise']});
});
test('live gateway probe rejects cross-tenant data, even when HTTP returns 200', async () => {
  await assert.rejects(verifyDockerTenants({env,fetcher:responder(true)}), /CROSS-TENANT DATA LEAK/);
});
test('live gateway probe fails when only Regular tier exists but full tenancy is required', async () => {
  const fake = async (url,init) => new URL(url).pathname === '/stores'
    ? new Response(JSON.stringify({items:tenants.slice(0,2)})) : responder()(url,init);
  await assert.rejects(verifyDockerTenants({env,fetcher:fake,requireAllTiers:true}), /Missing provisioned tier/);
});
