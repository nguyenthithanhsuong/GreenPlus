#!/usr/bin/env node
/** Repair one CONFIRMED vulnerable lockfile package, with rollback.
 * Does not run npm audit fix --force, remove dependency constraints, or touch DB.
 * This is opt-in because it needs access to the npm registry.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const TARGET='1.16.3';
const ROOT=resolve(import.meta.dirname,'../..');
export function versionLessThan(a,b){
  const left=String(a||'0').split('.').map(Number),right=b.split('.').map(Number);
  for(let i=0;i<3;i++)if((left[i]||0)!==(right[i]||0))return (left[i]||0)<(right[i]||0);
  return false;
}
export function vulnerableEntries(lock){
  return Object.entries(lock?.packages||{}).filter(([path,entry])=>
    (path==='node_modules/follow-redirects'||path.endsWith('/node_modules/follow-redirects'))&&versionLessThan(entry.version,TARGET));
}
export function updatedRootManifest(doc){
  return {...doc,overrides:{...doc.overrides,'follow-redirects':TARGET}};
}
export function repair({apply=false,runner}={}){
  const packagePath=resolve(ROOT,'package.json'),lockPath=resolve(ROOT,'package-lock.json');
  const manifestBytes=readFileSync(packagePath),lockBytes=readFileSync(lockPath);
  const originalManifest=JSON.parse(manifestBytes),originalLock=JSON.parse(lockBytes);
  const old=vulnerableEntries(originalLock);
  if(!old.length){console.log('No follow-redirects older than '+TARGET+' in the lockfile.');return {status:'already-patched',updated:false};}
  console.log('Affected follow-redirects entries: '+old.map(([path,v])=>`${path} ${v.version}`).join('; '));
  console.log('Known security patch: follow-redirects '+TARGET+'. This is not a full npm audit.');
  if(!apply){console.log('Dry run only. Run node scripts/ci/repair-known-npm-advisory.mjs --apply to reconcile the manifest and lockfile.');return {status:'dry-run',updated:false};}
  const run=runner||(()=>{
    const windows=process.platform==='win32';
    return spawnSync(windows?(process.env.ComSpec||'cmd.exe'):'npm',windows
      ? ['/d','/s','/c','npm install --package-lock-only --ignore-scripts --no-audit --fund=false']
      : ['install','--package-lock-only','--ignore-scripts','--no-audit','--fund=false'],
      {cwd:ROOT,encoding:'utf8',timeout:300000,windowsHide:true,maxBuffer:5*1024*1024});
  });
  let success=false;
  try{
    const updated=updatedRootManifest(originalManifest);
    writeFileSync(packagePath,JSON.stringify(updated,null,2)+'\n');
    const result=run();
    if(result.error||result.status!==0)throw Error('npm lockfile reconciliation failed ('+(result.error?.code||result.status)+'). '+String(result.stderr||'').slice(-600));
    const newLock=JSON.parse(readFileSync(lockPath,'utf8'));
    const still=vulnerableEntries(newLock);
    if(still.length)throw Error('Lockfile still pins vulnerable follow-redirects; refusing to accept partial update.');
    const entry=newLock.packages?.['node_modules/follow-redirects'];
    if(!entry?.resolved||!entry.integrity)throw Error('Lockfile missing registry resolution/integrity for the patched package.');
    success=true;
    console.log('Package manifest and lockfile updated and checked. Next: npm ci; npm audit --omit=dev');
    return {status:'updated',updated:true};
  }finally{
    if(!success){
      writeFileSync(packagePath,manifestBytes);
      writeFileSync(lockPath,lockBytes);
      console.error('Both package.json and package-lock.json restored to the prior state.');
    }
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try {if(process.argv.slice(2).some(a=>a!=='--apply'))throw Error('Only --apply is supported');repair({apply:process.argv.includes('--apply')});}
  catch(e){console.error(e.message);process.exitCode=1;}
}
