#!/usr/bin/env node
// Read-only Supabase Storage + Docker configuration audit. No uploads/deletes.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const manifest=JSON.parse(readFileSync(resolve(import.meta.dirname,'storage-contract.json'),'utf8'));
function staticCheck() {
 const source=readFileSync(resolve(root,'web-admin/src/app/api/storage/signed-upload/route.ts'),'utf8');
 const compose=readFileSync(resolve(root,'docker/three-tier/compose.yaml'),'utf8');
 const errors=[];
 for(const item of manifest.buckets)if(!source.includes(`"${item.name}"`))errors.push(`Storage bucket ${item.name} missing in signed-upload allowlist`);
 for(const volume of manifest.docker.postgresVolumes)if(!compose.includes(`  ${volume}:`))errors.push(`Docker DB volume ${volume} missing`);
 // A service-role signed upload may bypass Storage RLS: require store scoping or platform Admin only.
 const scoped=source.includes('path.startsWith(`${verifiedUser.storeId}/`)');
 const adminOnly=source.includes('verifiedUser.role !== "admin"');
 console.log('Storage static inventory:',manifest.buckets.map(b=>b.name).join(', '));
 if (!scoped && !adminOnly) errors.push('Signed-upload uses service role but is neither store-scoped nor admin-only');
 console.log(scoped?'Signed-upload has store-scoped path check':adminOnly?'Signed-upload service-role token limited to platform Admin only':'FAIL: signed-upload lacks store-scoped/admin-only authorization');
 console.log('Docker DB volumes present; object-storage API '+(manifest.docker.objectStorageImplemented?'declared':'NOT IMPLEMENTED'));
 if(errors.length)throw Error(errors.join('; '));
 return {scoped,adminOnly};
}
async function main() {
 staticCheck();
 if(!process.argv.includes('--live'))return;
 const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for live read-only audit.');
 const target=new URL('/storage/v1/bucket',url);
 if(target.protocol!=='https:')throw Error('Refusing non-HTTPS remote Supabase Storage audit');
 const response=await fetch(target,{headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error(`Supabase Storage list failed: HTTP ${response.status}`);
 const payload=await response.json();
 const buckets=Array.isArray(payload)?payload:Array.isArray(payload?.buckets)?payload.buckets:null;
 if(!buckets)throw Error('Unknown Supabase Storage list response; refusing to infer success');
 const actual=new Map(buckets.map(b=>[b.name||b.id,b]));
 const failures=[];
 for(const bucket of manifest.buckets) {
  const b=actual.get(bucket.name);
  if(!b){(bucket.required?failures:[]).push(`Missing required bucket: ${bucket.name}`);console.log(`${bucket.required?'FAIL':'WARN'} ${bucket.name}: missing`);continue;}
  if(bucket.public!==null && Boolean(b.public)!==bucket.public)failures.push(`Bucket ${bucket.name} unexpected visibility (${Boolean(b.public)?'public':'private'})`);
  console.log(`PASS ${bucket.name}: present; ${b.public?'public':'private'}`);
 }
 if(failures.length)throw Error(failures.join('; '));
 console.log('Storage bucket inventory passed. This does not certify path authorization, object bytes, or signed-upload permissions.');
}
main().catch(e=>{console.error('BLOCKED:',e.message);process.exitCode=1;});
