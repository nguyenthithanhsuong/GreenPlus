/** Non-mutating multi-tier gateway probe. Safe on an existing Docker volume. */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { fetchDockerGateway, dockerGatewayReadiness } from '../../web-admin/backend/core/docker-gateway.mjs';
import { validateTenant } from '../../packages/tenant-routing/index.mjs';

export async function verifyDockerTenants({env = process.env, fetcher = fetch, requireAllTiers = false} = {}) {
  const readiness = await dockerGatewayReadiness(env, fetcher);
  if (!readiness.ready) throw new Error(readiness.reason || 'Docker backend is not ready');
  const response = await fetchDockerGateway('/stores', {}, env, fetcher);
  if (!response.ok || !Array.isArray(response.data?.items) || response.data.items.length < 2)
    throw new Error('Docker catalog is empty or unavailable');
  const tenants = response.data.items.map(validateTenant);
  if (new Set(tenants.map((item) => item.store_id)).size !== tenants.length)
    throw new Error('Duplicate Docker tenant identifiers');
  if (requireAllTiers) {
    const missing = ['regular', 'pro', 'enterprise'].filter((tier) => !tenants.some((t) => t.tier === tier));
    if (missing.length) throw new Error(`Missing provisioned tier(s): ${missing.join(', ')}`);
  }
  let checks = 0;
  for (const tenant of tenants) {
    for (const resource of ['catalog-products', 'categories', 'inventory', 'orders']) {
      const path = `/stores/${tenant.store_id}/${resource}`;
      const result = await fetchDockerGateway(path, {}, env, fetcher);
      if (!result.ok || !Array.isArray(result.data?.items))
        throw new Error(`Gateway ${resource} read failed for tenant tier ${tenant.tier}`);
      if (result.data.items.some((item) => item.store_id !== tenant.store_id))
        throw new Error(`CROSS-TENANT DATA LEAK in ${resource} for ${tenant.tier}`);
      checks++;
    }
  }
  return { tenants: tenants.length, checks, tiers: [...new Set(tenants.map((item) => item.tier))] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const summary = await verifyDockerTenants({requireAllTiers: process.env.GREENPLUS_DOCKER_REQUIRE_ALL_TIERS === 'true'});
    console.log(`PASS: ${summary.tenants} tenant(s), ${summary.checks} scoped reads; tiers: ${summary.tiers.join(', ')}`);
  } catch (error) {
    console.error(`FAIL Docker tenancy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exitCode = 1;
  }
}
