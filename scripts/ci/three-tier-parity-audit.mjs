#!/usr/bin/env node
/** Read-only, fail-closed parity inventory. SQL parity != Supabase service parity. */
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const topology=JSON.parse(readFileSync(resolve(import.meta.dirname,'three-tier-contract.json'),'utf8'));
const sqlfiles=readdirSync(resolve(root,'supabase/migrations')).filter(x=>x.endsWith('.sql')).sort();
const expected=[...new Set(sqlfiles.flatMap(f=>[...readFileSync(resolve(root,'supabase/migrations',f),'utf8').matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.|public\.)(?:"([a-z_][a-z_0-9]*)"|([a-z_][a-z_0-9]*))/gi)].map(x=>x[1]||x[2])))].sort();
const supabaseMajor=Number(/^major_version\s*=\s*(\d+)/m.exec(readFileSync(resolve(root,'supabase/config.toml'),'utf8'))?.[1]);
const dockerDir=resolve(root,'docker/three-tier');
const fullCompose=resolve(dockerDir,'compose.full-schema.yaml');
const legacy=[
 {service:'shared-db',db:'greenplus_demo',schemas:['public','pro_a','pro_b']},
 {service:'enterprise-a-db',db:'enterprise_a',schemas:['public']},
 {service:'enterprise-b-db',db:'enterprise_b',schemas:['public']},
];
const canonical=[
 {service:'full-shared-db',db:'greenplus_full_shared',schemas:['public','pro_a','pro_b']},
 {service:'full-enterprise-a-db',db:'greenplus_full_enterprise_a',schemas:['public']},
 {service:'full-enterprise-b-db',db:'greenplus_full_enterprise_b',schemas:['public']},
];
function run(args){
 const p=spawnSync('docker',args,{encoding:'utf8',timeout:40000,maxBuffer:8*1024*1024});
 if(p.error||p.status!==0)throw Error(`Docker read-only query failed: ${p.error?.message??p.stderr?.slice(-350)??'container unavailable'}`);
 return p.stdout.trim();
}
function getTables(t,schema,full){
 const sql=`COPY (SELECT coalesce(json_agg(table_name ORDER BY table_name)::text,'[]') FROM information_schema.tables WHERE table_schema='${schema}' AND table_type='BASE TABLE') TO STDOUT;`;
 const compose=['compose','--project-directory',dockerDir,'-f',resolve(dockerDir,'compose.yaml')];
 if(full)compose.push('-f',fullCompose,'--profile','full-schema');
 const response=run([...compose,'exec','-T',t.service,'psql','-X','-q','-v','ON_ERROR_STOP=1','-U','postgres','-d',t.db,'-c',sql]);
 return JSON.parse(response);
}
function audit(t,full){return t.flatMap(target=>target.schemas.map(schema=>{
 const actual=getTables(target,schema,full);
 const missing=expected.filter(name=>!actual.includes(name));
 const scope={service:target.service,schema,matched:expected.length-missing.length,total:expected.length,missing};
 console.log(`${full?'PG17 canonical':'PG16 demo'} ${target.service}/${schema}: ${scope.matched}/${expected.length} source tables`);
 return scope;
}));}
try {
 if(expected.length!==44||sqlfiles.length!==19)throw Error('Source baseline changed; reapprove expected table/migration counts.');
 console.log(`Supabase canonical: ${sqlfiles.length} migrations, ${expected.length} public tables, configured PostgreSQL ${supabaseMajor}`);
 console.log('Tier mapping:',JSON.stringify(topology.tiers.map(t=>({tier:t.tier,service:t.service||t.databases.map(d=>d.service),slots:t.schemas||t.slot||t.databases.map(d=>d.slot)}))));
 if(process.argv.includes('--static')) {
  const manifest=JSON.parse(readFileSync(resolve(dockerDir,'full-schema/manifest.json'),'utf8'));
  if(manifest.migrations.length!==sqlfiles.length)throw Error('Canonical Docker manifest does not include all Supabase migrations.');
  console.log('Static check: canonical PG17 5-scope migration pipeline exists; no live database queried.');
 } else {
  const full=audit(canonical,true);
  const old=audit(legacy,false);
  const schemaComplete=full.every(x=>x.missing.length===0);
  const report={schemaComplete,supabaseMajor,canonicalDockerMajor:17,legacyDockerMajor:16,canonical:full,legacy:old,serviceParity:false};
  if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  if(!schemaComplete)throw Error('Canonical PostgreSQL17 scopes are missing Supabase tables. Run npm run docker:three-tier:full-migrate after backup.');
  const verified=spawnSync(process.execPath,[resolve(root,'scripts/three-tier-full-schema.mjs'),'--check'],{encoding:'utf8',timeout:240000});
  if(verified.error||verified.status!==0)throw Error(`Canonical 0001–0019 checksums/RLS/RPC not verified: ${(verified.stderr||'').slice(-850)}`);
  console.log('PASS: canonical PostgreSQL17 migration history and selected RLS/RPC checks (five scopes).');
 }
 if(process.argv.includes('--require-full-parity'))throw Error('DATABASE-SCHEMA parity is not API/service parity. Supabase Auth, Realtime, Storage, request-JWT RLS and application routing have not been certified; production cutover BLOCKED.');
 console.log('NOT FULL SERVICE PARITY: PG16 legacy demo and PG17 canonical schema coexist. Do not switch production backend.');
} catch(e){console.error(`BLOCKED: ${e.message}`);process.exitCode=1;}
