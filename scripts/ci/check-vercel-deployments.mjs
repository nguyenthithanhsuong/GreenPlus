/** Post-CI verification: each Vercel production deployment must be READY for the exact tested SHA. */
import { pathToFileURL } from 'node:url';
export async function verifyDeployments(env, fetcher=fetch, pause=ms=>new Promise(r=>setTimeout(r,ms)), log=console.log) {
 const needed=['VERCEL_TOKEN','VERCEL_PROJECT_ADMIN','VERCEL_PROJECT_CLIENT','VERCEL_PROJECT_SHIPPER','GITHUB_SHA'];
 const missing=needed.filter(k=>!env[k]?.trim());
 if(missing.length)throw Error(`Missing Vercel deployment verification configuration: ${missing.join(', ')}`);
 // Poll three independent projects concurrently so this check does not spend 3 x the wait window.
 await Promise.all(['ADMIN','CLIENT','SHIPPER'].map(async app => {
  const project=env[`VERCEL_PROJECT_${app}`];
  const params=new URLSearchParams({projectId:project,limit:'30',target:'production'});
  if(env.VERCEL_TEAM_ID)params.set('teamId',env.VERCEL_TEAM_ID);
  const url=`https://api.vercel.com/v6/deployments?${params}`;
  let ready=false;
  for(let attempt=0;attempt<20;attempt++) {
   const response=await fetcher(url,{
    headers:{Authorization:`Bearer ${env.VERCEL_TOKEN}`},
    signal:AbortSignal.timeout(15000),redirect:'error',
   });
   if(response.status!==200)throw Error(`Vercel ${app} deployments API HTTP ${response.status}`);
   const data=await response.json();
   if(!Array.isArray(data.deployments))throw Error(`Vercel ${app} returned invalid deployments payload`);
   const found=data.deployments.find(d=>d.meta?.githubCommitSha===env.GITHUB_SHA);
   if(found && ['ERROR','CANCELED'].includes(found.readyState||found.state))
    throw Error(`Vercel ${app} deployment for tested commit failed: ${found.readyState||found.state}`);
   if(found && (found.readyState==='READY'||found.state==='READY')){ready=true;break;}
   if(attempt<19)await pause(20000);
  }
  if(!ready)throw Error(`Vercel ${app} has no READY production deployment for CI commit ${env.GITHUB_SHA.slice(0,8)}`);
  log(`PASS Vercel ${app}: exact CI commit is READY in production`);
 }));
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 verifyDeployments(process.env).catch(e=>{console.error(`FAIL Vercel deployment: ${e.message}`);process.exitCode=1;});
}
