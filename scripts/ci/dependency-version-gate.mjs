/** Offline security gate independent of npm registry availability.
 * A known vulnerable Next.js lock cannot be published just because audit is offline.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MIN_SAFE_NEXT='16.4.5';
export function versionAtLeast(version,min=MIN_SAFE_NEXT){
  const a=/^(\d+)\.(\d+)\.(\d+)$/.exec(version||'');
  const b=/^(\d+)\.(\d+)\.(\d+)$/.exec(min);
  if(!a||!b)return false;
  for(let i=1;i<=3;i++){
    const d=Number(a[i])-Number(b[i]);
    if(d!==0)return d>0;
  }
  return true;
}
export function validateDependencyVersions({root,workspaces,lock}){
  const errors=[];
  if(!versionAtLeast(root?.overrides?.next)) errors.push('root overrides.next');
  for(const app of ['admin','client','shipper']){
    const w=workspaces[app];
    const l=lock?.packages?.[`web-${app}`];
    if(!versionAtLeast(w?.dependencies?.next))errors.push(`web-${app} dependencies.next`);
    if(!versionAtLeast(w?.devDependencies?.['eslint-config-next']))errors.push(`web-${app} eslint-config-next`);
    if(!versionAtLeast(l?.dependencies?.next))errors.push(`lock web-${app} next`);
    if(!versionAtLeast(l?.devDependencies?.['eslint-config-next']))errors.push(`lock web-${app} eslint-config-next`);
  }
  for(const key of ['next','eslint-config-next']){
    if(!versionAtLeast(lock?.packages?.[`node_modules/${key}`]?.version))errors.push(`lock node_modules/${key}`);
  }
  if(lock?.packages?.['']?.overrides?.next && !versionAtLeast(lock.packages[''].overrides.next))errors.push('lock root overrides.next');
  const pinned=root?.overrides?.next;
  if(pinned && versionAtLeast(pinned)){
    if(lock?.packages?.['node_modules/next']?.version!==pinned)errors.push('lock next differs from root override');
    if(lock?.packages?.['node_modules/eslint-config-next']?.version!==pinned)errors.push('lock eslint-config-next differs from root override');
    for(const app of ['admin','client','shipper']){
      const w=workspaces[app],l=lock?.packages?.[`web-${app}`];
      for(const [label,actual] of [
        ['manifest next',w?.dependencies?.next],
        ['manifest eslint',w?.devDependencies?.['eslint-config-next']],
        ['lock next',l?.dependencies?.next],
        ['lock eslint',l?.devDependencies?.['eslint-config-next']],
      ]) if(actual!==pinned)errors.push(`web-${app} ${label} differs from root override`);
    }
  }
  return {ok:errors.length===0,errors};
}
export function checkWorkingTree(base=resolve(import.meta.dirname,'../..')){
  const read=file=>JSON.parse(readFileSync(resolve(base,file),'utf8'));
  return validateDependencyVersions({
    root:read('package.json'),
    workspaces:Object.fromEntries(['admin','client','shipper'].map(app=>[app,read(`web-${app}/package.json`)])),
    lock:read('package-lock.json'),
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const result=checkWorkingTree();
    if(!result.ok){
      console.error(`BLOCKED: Next.js security baseline ${MIN_SAFE_NEXT}+ required in root, all workspaces and lockfile (${result.errors.join(', ')}).`);
      console.error('Run the final GreenPlus PowerShell script to upgrade dependencies before publishing.');
      process.exitCode=1;
    } else console.log(`PASS: verified Next.js ${MIN_SAFE_NEXT}+ in every workspace and npm lockfile.`);
  }catch{console.error('BLOCKED: unable to inspect required dependency manifests / npm lockfile.');process.exitCode=1;}
}
