/** Audits production dependencies once. Confirmed high/critical findings block CI;
 * provider/registry outages produce WARNING, never a fabricated PASS.
 * Only aggregate counts are persisted; npm's raw response is not uploaded.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const levels = ['info','low','moderate','high','critical'];
export function summarizeAudit(result) {
  const raw = result?.stdout || '';
  let doc;
  try { doc = JSON.parse(raw); } catch { return {status:'warning',code:'AUDIT_UNAVAILABLE',counts:null}; }
  const vuln = doc?.metadata?.vulnerabilities;
  if (!vuln || !levels.every(level=>Number.isSafeInteger(vuln[level]??0) && (vuln[level]??0)>=0) || doc.error) {
    return {status:'warning',code:'AUDIT_UNAVAILABLE',counts:null};
  }
  const counts=Object.fromEntries(levels.map(level=>[level,vuln[level]??0]));
  const blocked=counts.high+counts.critical>0;
  return {status:blocked?'blocked':'pass',code:blocked?'HIGH_OR_CRITICAL_VULNERABILITIES':counts.moderate?'MODERATE_ADVISORIES':'OK',counts};
}

export function renderAuditSummary(report){
  const badge=report.status==='pass'?'✅ PASS':report.status==='blocked'?'❌ BLOCKED':'⚠️ WARNING';
  const counts=report.counts?`Critical: ${report.counts.critical}; High: ${report.counts.high}; Moderate: ${report.counts.moderate}`:'Counts unavailable';
  return `## GreenPlus · Dependency security\n\n${badge} · ${report.code} · ${counts}\n\nConfirmed high/critical vulnerabilities block publication. A registry outage is reported as WARNING, not falsely marked PASS.\n\n`;
}

export async function auditProduction({runner,output='artifacts/ci/dependency-audit.json',summaryPath}={}){
  const command=runner||(()=>{
    const windows=process.platform==='win32';
    return spawnSync(windows?(process.env.ComSpec||'cmd.exe'):'npm',windows
      ? ['/d','/s','/c','npm audit --omit=dev --json']
      : ['audit','--omit=dev','--json'],
      {encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,windowsHide:true});
  });
  const result=command();
  const report=result?.error ? {status:'warning',code:'AUDIT_UNAVAILABLE',counts:null} : summarizeAudit(result);
  await mkdir(resolve(output,'..'),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  const markdown=renderAuditSummary(report);
  if(summaryPath)await appendFile(summaryPath,markdown);
  return {report,markdown,ok:report.status!=='blocked'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const {ok,markdown}=await auditProduction({summaryPath:process.env.GITHUB_STEP_SUMMARY});
  console.log(markdown);
  if(!ok)process.exitCode=1;
}
