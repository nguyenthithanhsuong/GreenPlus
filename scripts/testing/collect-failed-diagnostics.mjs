#!/usr/bin/env node
/** Bundle failing, skipped and explicitly advisory gate diagnostics into a redacted Markdown file.
 * No network, no credentials, no command re-execution.
 */
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {redact} from './verify-seven-areas.mjs';
const ROOT=resolve(import.meta.dirname,'../..');
const DIR=join(ROOT,'artifacts/testing/seven-areas');
export function collectFailures(report,readLog){
  const lines=['# GreenPlus · Diagnostics for failed/incomplete verification gates','',`Generated: ${new Date().toISOString()}`,'',
    'These are excerpts, not proof that a gate passed. Logs have been redacted for known secret patterns.',''];
  let count=0;
  for(const group of report.groups||[])for(const item of group.checks||[]){
    if(!['FAIL','SKIPPED','ADVISORY'].includes(item.status))continue;
    count++;
    lines.push(`## ${redact(group.area)} / ${redact(item.check)}`,'',
      `Status: ${item.status}; Detail: ${redact(item.detail||'-')}`,'');
    if(item.log && /^[a-z0-9-]+\.log$/.test(item.log)) {
      const log=redact(readLog(item.log)||'Log file missing').slice(-28000).replace(/```/g,'[code fence]');
      lines.push('```text',log,'```','');
    }
  }
  if(!count)lines.push('No failed or skipped checks in this report.');
  return lines.join('\n')+'\n';
}
export function collect({reportPath}={}){
  const source=reportPath||join(DIR,existsSync(join(DIR,'combined-report.json'))?'combined-report.json':existsSync(join(DIR,'recheck-report.json'))?'recheck-report.json':'report.json');
  if(!existsSync(source))throw Error('No report found. Run verify-seven-areas.mjs first.');
  const report=JSON.parse(readFileSync(source,'utf8'));
  const markdown=collectFailures(report,name=>{
    const file=join(DIR,name);
    return existsSync(file)?readFileSync(file,'utf8'):'';
  });
  mkdirSync(DIR,{recursive:true});
  const dest=join(DIR,'failure-diagnostics.md');
  writeFileSync(dest,markdown,{mode:0o600});
  console.log(`Diagnostics: ${dest}`);
  return dest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{collect();}catch(e){console.error(e.message);process.exitCode=1;}
}
