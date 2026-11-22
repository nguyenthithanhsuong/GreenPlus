/** Non-mutating multi-tier gateway probe. Safe on an existing Docker volume. */
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
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

/** Remote unavailability is advisory; a verified tenant-isolation violation is not. */
export function classifyRemoteGatewayError(error) {
  const reason=error instanceof Error?error.message:String(error);
  const breach=/^(CROSS-TENANT DATA LEAK|Duplicate Docker tenant identifiers)/.test(reason);
  return {status:breach?'blocked':'warning',code:breach?'TENANT_ISOLATION_VIOLATION':'REMOTE_GATEWAY_UNAVAILABLE'};
}

export async function runGatewayProbe({verify=verifyDockerTenants,advisory=false,output='artifacts/ci/docker-gateway.json'}={}){
  let report;
  try {
    const data=await verify({requireAllTiers:process.env.GREENPLUS_DOCKER_REQUIRE_ALL_TIERS==='true'});
    report={status:'pass',code:'OK',tenants:data.tenants,checks:data.checks};
  } catch(error) {
    report=classifyRemoteGatewayError(error);
    if(!advisory && report.status==='warning') report={...report,status:'blocked'};
  }
  await mkdir(resolve(output,'..'),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  const detail=report.status==='pass'?`${report.tenants} tenants, ${report.checks} scoped reads`:report.code;
  const text=`### Remote Docker Gateway: ${report.status.toUpperCase()} · ${detail}\n\n`;
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,text);
  return {report,ok:report.status!=='blocked'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const advisory=process.argv.includes('--advisory');
  const {report,ok}=await runGatewayProbe({advisory});
  if(report.status==='warning')console.log(`::warning title=Remote Docker Gateway::${report.code}`);
  console.log(`${report.status.toUpperCase()}: Docker tenancy · ${report.code}`);
  if(!ok)process.exitCode=1;
}
