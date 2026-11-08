/** Read-only service probes (except one synthetic Better Stack log). Never uses service-role credentials. */
import { pathToFileURL } from 'node:url';

const required = [
  'SUPABASE_URL','SUPABASE_ANON_KEY','VERCEL_TOKEN',
  'VERCEL_PROJECT_ADMIN','VERCEL_PROJECT_CLIENT','VERCEL_PROJECT_SHIPPER',
  'SENTRY_AUTH_TOKEN','SENTRY_ORG','SENTRY_PROJECT_ADMIN','SENTRY_PROJECT_CLIENT','SENTRY_PROJECT_SHIPPER',
  'BETTER_STACK_SOURCE_TOKEN','BETTER_STACK_URL',
];
export function missingConfig(env) { return required.filter(k => !env[k]?.trim()); }
const slug = s => encodeURIComponent(s);
// Legacy anon keys are JWTs. New sb_publishable_* keys are not JWTs and
// must never be sent as an Authorization bearer token.
const isLegacyJwt = key => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key);


async function request(url, {token,headers={},method='GET',body,fetcher=fetch,allowed=[200]}={}) {
  const u=new URL(url);
  if (u.protocol !== 'https:') throw new Error('External check requires HTTPS');
  let response;
  try {
    response=await fetcher(u.toString(),{
      method,
      headers: {...(token ? {Authorization:`Bearer ${token}`} : {}), ...headers},
      body: body && JSON.stringify(body),
      signal:AbortSignal.timeout(12000),
      redirect:'error',
    });
  } catch(e) { throw new Error(`Network request failed for ${u.hostname}: ${e.name === 'TimeoutError'?'timeout':e.message}`); }
  if (!allowed.includes(response.status)) throw new Error(`${u.hostname} returned HTTP ${response.status} (expected ${allowed.join('/')})`);
  if (response.status===204) return null;
  try {return await response.json();} catch {return null;}
}

export async function checkProviders(env, fetcher=fetch, log=console.log) {
  const missing=missingConfig(env);
  if(missing.length) throw new Error(`Missing CI secrets/variables: ${missing.join(', ')}. Live checks are required on main.`);

  const origin=new URL(env.SUPABASE_URL);
  if(origin.protocol!=='https:')throw new Error('Supabase Online URL must use HTTPS');
  await request(new URL('/auth/v1/health',origin).toString(),{
    fetcher,headers:{apikey:env.SUPABASE_ANON_KEY},allowed:[200],
  });
  log('PASS Supabase Online Auth health');
  // /rest/v1/ is an OpenAPI root, not an anonymous health endpoint. Public
  // keys may be denied on it even when normal table access is functioning.
  // stores is a committed GreenPlus table; limit=0 validates the actual REST
  // route and public-key authentication without retrieving any store rows.
  const anonKey=env.SUPABASE_ANON_KEY;
  const restHeaders={
    apikey:anonKey,
    ...(isLegacyJwt(anonKey) ? {Authorization:`Bearer ${anonKey}`} : {}),
  };
  const stores=await request(new URL('/rest/v1/stores?select=store_id&limit=0',origin).toString(),{
    fetcher,headers:restHeaders,allowed:[200],
  });
  if(!Array.isArray(stores))throw new Error('Supabase Online REST stores probe returned an invalid JSON array');
  log('PASS Supabase Online REST stores route (public key, zero rows requested)');

  const team=env.VERCEL_TEAM_ID ? `?teamId=${slug(env.VERCEL_TEAM_ID)}` : '';
  for(const app of ['ADMIN','CLIENT','SHIPPER']) {
    const project=env[`VERCEL_PROJECT_${app}`];
    const data=await request(`https://api.vercel.com/v9/projects/${slug(project)}${team}`,{
      token:env.VERCEL_TOKEN,fetcher,
    });
    if(!data || !(data.id || data.name)) throw new Error(`Vercel ${app} project API response invalid`);
    log(`PASS Vercel ${app} project authentication (not deployment SHA verification)`);
  }
  for(const app of ['ADMIN','CLIENT','SHIPPER']) {
    const data=await request(`https://sentry.io/api/0/projects/${slug(env.SENTRY_ORG)}/${slug(env[`SENTRY_PROJECT_${app}`])}/`,{
      token:env.SENTRY_AUTH_TOKEN,fetcher,
    });
    if(!data?.id || !data?.slug)throw new Error(`Sentry ${app} project payload invalid`);
    log(`PASS Sentry ${app} project read`);
  }
  const ingest=new URL(env.BETTER_STACK_URL);
  if(ingest.protocol!=='https:' || !/^(?:[a-z0-9-]+\.)*betterstack(?:data)?\.com$/i.test(ingest.hostname))
    throw new Error('BETTER_STACK_URL must be an HTTPS Better Stack ingest host');
  await request(ingest.toString(),{
    token:env.BETTER_STACK_SOURCE_TOKEN,fetcher,method:'POST',allowed:[202],
    headers:{'Content-Type':'application/json'},
    body:{message:'GreenPlus CI connectivity probe',level:'INFO',source:'github-actions',
      context:{kind:'synthetic',sha:(env.GITHUB_SHA||'').slice(0,12)}},
  });
  log('PASS Better Stack ingestion accepted synthetic test event (HTTP 202)');
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  checkProviders(process.env).catch(e=>{console.error(`FAIL external services: ${e.message}`);process.exitCode=1;});
}
