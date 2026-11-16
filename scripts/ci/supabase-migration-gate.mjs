#!/usr/bin/env node
// Read-only by default. --apply is only allowed on the matching main SHA after successful CI.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inventoryMigrations,verifyImmutableBaseline,planRemoteMigrations } from './migration-safety.mjs';
const args=process.argv.slice(2);
const apply=args.includes('--apply');
const i=args.indexOf('--list-file');
if(i>=0 && !args[i+1]) throw Error('Missing --list-file path');
function cli(argv){const r=spawnSync('supabase',argv,{encoding:'utf8',timeout:180000,windowsHide:true});
 if(r.error||r.status!==0)throw Error(`Supabase CLI command ${argv.slice(0,2).join(' ')} failed (check CI logs; credentials redacted)`);
 return r.stdout+'\n'+r.stderr;}
try {
 const rows=inventoryMigrations();verifyImmutableBaseline(rows);
 console.log(`PASS: ${rows.length} migrations present; immutable baseline verified.`);
 const latest=rows.at(-1);
 console.log(`Latest local: ${latest.file}. AutoSafe: ${latest.autoSafe}.`);
 if(args.includes('--static'))process.exit(0);
 const listing=i>=0?readFileSync(resolve(args[i+1]),'utf8'):cli(['migration','list','--linked']);
 const plan=planRemoteMigrations(rows,listing);
 console.log(`Applied: ${plan.applied}/${rows.length}; pending: ${plan.pending.length}: ${plan.pending.join(', ')||'none'}`);
 if(!apply)process.exit(0);
 if(process.env.GREENPLUS_SUPABASE_AUTODEPLOY!=='true')throw Error('Auto-deploy is disabled. Set repository variable GREENPLUS_SUPABASE_AUTODEPLOY=true deliberately.');
 if(process.env.GITHUB_REF!=='refs/heads/main'||process.env.CI_VERIFIED_SHA!==process.env.GITHUB_SHA || !/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA||''))throw Error('Not a CI-verified main commit; deployment refused.');
 if(i>=0)throw Error('Refuse to apply when migration listing was supplied from a file');
 if(!plan.pending.length){console.log('No new migrations: no push.');process.exit(0);}
 const dry=cli(['db','push','--linked','--dry-run']);
 for(const file of plan.pending)if(!dry.includes(file))throw Error(`Dry-run did not list expected migration ${file}; refusing deploy`);
 // No destructive flags, no seeds, no --include-all. Supabase tracks applied versions.
 console.log('PASS remote prefix + static policy + dry-run. Applying approved missing migrations...');
 cli(['db','push','--linked','--yes']);
 const after=planRemoteMigrations(rows,cli(['migration','list','--linked']));
 if(after.pending.length)throw Error(`Post-deploy verification: still pending ${after.pending.join(',')}`);
 console.log('PASS: remote migrations applied and verified.');
} catch(e){console.error(`BLOCKED: ${e.message}`);process.exitCode=1;}
