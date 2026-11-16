#!/usr/bin/env node
// Live, read-only catalog inventory: the assignment of store->tier is DATA,
// never inferred from database name or static seeding after provisioning.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { storageForTenant, TIERS, SLOTS } from '../../packages/tenant-routing/index.mjs';
const root=resolve(import.meta.dirname,'../..');
const t=JSON.parse(readFileSync(resolve(import.meta.dirname,'three-tier-contract.json'),'utf8'));
try {
 if(process.argv.includes('--static')) {
  for(const tier of t.tiers) console.log(`${tier.tier}: ${tier.isolation}; seed: ${tier.seedStores?.map(s=>s.name).join(', ')||'(empty slots)'}`);
 } else {
  const env=resolve(root,'docker/three-tier/.env');
  if(!existsSync(env))throw Error('Missing docker/three-tier/.env; run npm run docker:three-tier:up first');
  const key=/^DEMO_GATEWAY_KEY=(.+)$/m.exec(readFileSync(env,'utf8'))?.[1]?.trim();
  if(!key||key.length<32)throw Error('Invalid local gateway secret (not printed)');
  const url='http://127.0.0.1:4100/stores'; // not user-configurable
  const r=await fetch(url,{headers:{'x-demo-gateway-key':key},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error(`Read-only tier registry failed: ${r.status}`);
  const payload=await r.json();
  if(!Array.isArray(payload.items))throw Error('Unexpected catalog shape');
  const seen=new Set();const used=new Set();
  for(const store of payload.items){
   const target=storageForTenant(store);
   if(seen.has(store.store_id))throw Error('Duplicate store UUID');seen.add(store.store_id);
   if(store.tier!=='regular'){
    const slot=`${store.tier}:${store.slot}`;
    if(used.has(slot))throw Error(`Tier slot assigned twice: ${slot}`);
    used.add(slot);
   }
   console.log(`${store.name}\t${store.tier}\t${store.slot}\t${target.database}/${target.schema}\t${store.store_id}`);
  }
  for(const tier of TIERS){
   const members=payload.items.filter(x=>x.tier===tier);
   const open=tier==='regular'?'shared (multiple stores)':SLOTS[tier].filter(s=>!members.some(m=>m.slot===s)).join(', ')||'(full)';
   console.log(`${tier}: ${members.length} stores; available slots: ${open}`);
  }
  console.log('Read-only Docker tier inventory PASS. Does not imply Supabase migration or Auth parity.');
 }
}catch(e){console.error(`FAIL: ${e.message}`);process.exitCode=1;}
