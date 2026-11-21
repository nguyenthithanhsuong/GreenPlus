/** External provider diagnostics. Strict API retained for tests and manual gate.
 * Default CLI mode is advisory: failures are captured, not converted into fake PASS.
 * No service-role credentials, URLs containing tokens, or provider responses in reports.
 */
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const required = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'VERCEL_TOKEN',
  'VERCEL_PROJECT_ADMIN', 'VERCEL_PROJECT_CLIENT', 'VERCEL_PROJECT_SHIPPER',
  'SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT_ADMIN', 'SENTRY_PROJECT_CLIENT', 'SENTRY_PROJECT_SHIPPER',
  'BETTER_STACK_SOURCE_TOKEN', 'BETTER_STACK_URL',
];
export function missingConfig(env) { return required.filter(k => !env[k]?.trim()); }
const slug = s => encodeURIComponent(s);
const isLegacyJwt = key => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key);

async function request(url, {token, headers={}, method='GET', body, fetcher=fetch, allowed=[200]}={}) {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error('HTTPS_REQUIRED');
  let response;
  try {
    response = await fetcher(u.toString(), {
      method,
      headers: {...(token ? {Authorization: `Bearer ${token}`} : {}), ...headers},
      body: body && JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
      redirect: 'error',
    });
  } catch (error) {
    // Do not print arbitrary fetch exception messages: they can embed full URLs or credentials.
    const code = error?.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR';
    throw new Error(code);
  }
  if (!allowed.includes(response.status)) throw new Error(`HTTP_${response.status}`);
  if (response.status === 204) return null;
  try { return await response.json(); } catch { return null; }
}

function checks(env, fetcher) {
  const anonKey = env.SUPABASE_ANON_KEY;
  const origin = () => {
    const u = new URL(env.SUPABASE_URL);
    if (u.protocol !== 'https:') throw new Error('HTTPS_REQUIRED');
    return u;
  };
  const tasks = [
    {id:'supabase-auth', label:'Supabase Auth', config:['SUPABASE_URL','SUPABASE_ANON_KEY'], run:async()=>{
      await request(new URL('/auth/v1/health',origin()),{fetcher,headers:{apikey:anonKey}});
    }},
    {id:'supabase-rest', label:'Supabase REST (zero rows)', config:['SUPABASE_URL','SUPABASE_ANON_KEY'], run:async()=>{
      const headers={apikey:anonKey,...(isLegacyJwt(anonKey) ? {Authorization:`Bearer ${anonKey}`} : {})};
      const data=await request(new URL('/rest/v1/stores?select=store_id&limit=0',origin()),{fetcher,headers});
      if(!Array.isArray(data))throw new Error('INVALID_RESPONSE');
    }},
  ];
  for(const app of ['ADMIN','CLIENT','SHIPPER']) tasks.push({
    id:`vercel-${app.toLowerCase()}`, label:`Vercel ${app}`,
    config:['VERCEL_TOKEN',`VERCEL_PROJECT_${app}`],
    run:async()=>{
      const team=env.VERCEL_TEAM_ID ? `?teamId=${slug(env.VERCEL_TEAM_ID)}` : '';
      const data=await request(`https://api.vercel.com/v9/projects/${slug(env[`VERCEL_PROJECT_${app}`])}${team}`,{token:env.VERCEL_TOKEN,fetcher});
      if(!data || !(data.id || data.name))throw new Error('INVALID_RESPONSE');
    },
  });
  for(const app of ['ADMIN','CLIENT','SHIPPER']) tasks.push({
    id:`sentry-${app.toLowerCase()}`, label:`Sentry ${app}`,
    config:['SENTRY_AUTH_TOKEN','SENTRY_ORG',`SENTRY_PROJECT_${app}`],
    run:async()=>{
      const data=await request(`https://sentry.io/api/0/projects/${slug(env.SENTRY_ORG)}/${slug(env[`SENTRY_PROJECT_${app}`])}/`,{token:env.SENTRY_AUTH_TOKEN,fetcher});
      if(!data?.id || !data?.slug)throw new Error('INVALID_RESPONSE');
    },
  });
  tasks.push({id:'better-stack',label:'Better Stack ingest',config:['BETTER_STACK_SOURCE_TOKEN','BETTER_STACK_URL'],run:async()=>{
    const ingest=new URL(env.BETTER_STACK_URL);
    if(ingest.protocol!=='https:' || !/^(?:[a-z0-9-]+\.)*betterstack(?:data)?\.com$/i.test(ingest.hostname))throw new Error('INVALID_INGEST_HOST');
    await request(ingest.toString(),{
      token:env.BETTER_STACK_SOURCE_TOKEN,fetcher,method:'POST',allowed:[202],
      headers:{'Content-Type':'application/json'},
      body:{message:'GreenPlus CI connectivity probe',level:'INFO',source:'github-actions',context:{kind:'synthetic',sha:(env.GITHUB_SHA||'').slice(0,12)}},
    });
  }});
  return tasks;
}

/** Explicit fail-closed API for security/release validation. Never used as the default optional CI probe. */
export async function checkProviders(env, fetcher=fetch, log=console.log) {
  const missing=missingConfig(env);
  if(missing.length)throw new Error(`Missing CI secrets/variables: ${missing.join(', ')}.`);
  for(const task of checks(env,fetcher)){
    await task.run();
    log(`PASS ${task.label}`);
  }
}

/** Independent advisory checks: a down provider must not hide other providers' status. */
export async function probeProviders(env, fetcher=fetch) {
  const results=await Promise.all(checks(env,fetcher).map(async task=>{
    const missing=task.config.filter(k=>!env[k]?.trim());
    if(missing.length)return {id:task.id,provider:task.label,status:'warning',reason:`MISSING_CONFIG: ${missing.join(', ')}`};
    try{await task.run();return {id:task.id,provider:task.label,status:'pass'};}
    catch(e){
      const known=/^(?:HTTP_\d{3}|TIMEOUT|NETWORK_ERROR|INVALID_RESPONSE|HTTPS_REQUIRED|INVALID_INGEST_HOST)$/;
      return {id:task.id,provider:task.label,status:'warning',reason:known.test(e?.message||'')?e.message:'INVALID_CONFIG_OR_RESPONSE'};
    }
  }));
  return {mode:'advisory',overall:results.some(r=>r.status==='warning')?'warning':'pass',results};
}

export function renderExternalReport(report) {
  const lines=['## External services — advisory only','','| Provider | Result | Detail |','|---|---|---|'];
  for(const r of report.results){
    const reason=(r.reason||'OK').replaceAll('|','/');
    lines.push(`| ${r.provider} | ${r.status==='pass'?'✅ PASS':'⚠️ WARNING'} | ${reason} |`);
  }
  lines.push('','External outages/missing credentials do **not** fail CI. Local tests, Docker build, tenant isolation, and migration safety remain required.');
  return lines.join('\n')+'\n';
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const strict=process.argv.includes('--strict');
  const argIndex=process.argv.indexOf('--output');
  const output=argIndex>=0?process.argv[argIndex+1]: 'artifacts/ci/external-services.json';
  if(strict){
    checkProviders(process.env).catch(e=>{console.error(`FAIL strict provider check: ${e.message}`);process.exitCode=1;});
  }else{
    const report=await probeProviders(process.env);
    await mkdir(dirname(output),{recursive:true});
    await writeFile(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
    const summary=renderExternalReport(report);
    console.log(summary);
    if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
    for(const row of report.results.filter(r=>r.status==='warning')){
      console.log(`::warning title=External service unavailable::${row.provider}: ${row.reason}`);
    }
  }
}
