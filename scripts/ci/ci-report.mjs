/** Reports CI gate outcomes in GitHub Actions Run Summary; never changes gate outcomes. */
import { readFile, mkdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export const requiredJobs = [
  ['pipeline-contracts','CI rules / migration policy'],
  ['frontend-ci','Admin / Client / Shipper lint, types, build'],
  ['backend-ci','Backend / security tests'],
  ['ai-service-ci','AI FastAPI / container'],
  ['docker-db-ci','Three-tier Docker integration'],
  ['supabase-db-ci','Local Supabase / RLS'],
  ['docker-build','Docker images / smoke / publish'],
];
export const advisoryJobs = [['external-services-ci','External services / remote availability']];
const labels = {success:'✅ PASS',failure:'❌ FAIL',skipped:'⏭️ SKIPPED',cancelled:'🛑 CANCELLED',pending:'⏳ PENDING'};
const clean = s => String(s??'').replace(/[|\r\n<>]/g,' ').slice(0,160);
const resultLabel = result => labels[result] || `❔ ${clean(result||'UNKNOWN')}`;

export function summarizeCiNeeds(needs, externalReport) {
  const required=requiredJobs.map(([id,label])=>({id,label,result:needs?.[id]?.result||'pending',blocking:true}));
  const advisory=advisoryJobs.map(([id,label])=>({id,label,result:needs?.[id]?.result||'pending',blocking:false}));
  const blocked=required.filter(j=>j.result!=='success');
  return {kind:'CI',overall:blocked.length?'blocked':'passed',required,advisory,external:externalReport||null};
}

export function renderCiSummary(report, {sha='',url=''}={}) {
  const rows=['# GreenPlus · CI/CD Report','',`**Core quality/release gates:** ${report.overall==='passed'?'✅ Passed':'❌ Blocked or incomplete'}`];
  if(sha)rows.push(`**Commit:** \`${clean(sha).slice(0,40)}\``);
  if(url && /^https:\/\/github\.com\//.test(url))rows.push(`**Workflow run:** [View in Actions](${url})`);
  rows.push('','## Required quality and deployment gates','','| Job | Status |','|---|---|');
  for(const j of report.required)rows.push(`| ${clean(j.label)} | ${resultLabel(j.result)} |`);
  rows.push('','## Advisory diagnostics (not release blockers)','','| Job | Status |','|---|---|');
  for(const j of report.advisory)rows.push(`| ${clean(j.label)} | ${resultLabel(j.result)} |`);
  if(report.external?.results){
    rows.push('','### Provider status','','| Provider | Status | Detail |','|---|---|---|');
    for(const entry of report.external.results)rows.push(`| ${clean(entry.provider)} | ${entry.status==='pass'?'✅ PASS':'⚠️ WARNING'} | ${clean(entry.reason||'OK')} |`);
  } else rows.push('','Provider details: see the **Services CI** job summary; on PRs and feature branches live probes are not run.');
  rows.push('','**Policy:** Lint, typecheck, unit/integration, database isolation, immutable migrations, Docker smoke/build and publication remain fail-closed. Outside provider outages or absent optional credentials are warnings. This report is informational; it never turns a failed gate green.','');
  return rows.join('\n');
}

export async function writeCiReport({needs, externalReport, sha, runUrl, output='artifacts/ci/ci-report.json', summaryPath}={}) {
  const report=summarizeCiNeeds(needs,externalReport);
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  const markdown=renderCiSummary(report,{sha,url:runUrl});
  if(summaryPath)await appendFile(summaryPath,markdown);
  return {report,markdown};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const needs=JSON.parse(process.env.CI_NEEDS_JSON||'{}');
  let external=null;
  try{external=JSON.parse(await readFile('artifacts/ci/external-services.json','utf8'));}catch{}
  const {markdown}=await writeCiReport({needs,externalReport:external,sha:process.env.GITHUB_SHA,runUrl:process.env.GITHUB_SERVER_URL&&process.env.GITHUB_REPOSITORY&&process.env.GITHUB_RUN_ID?`${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:'',summaryPath:process.env.GITHUB_STEP_SUMMARY});
  console.log(markdown);
}
