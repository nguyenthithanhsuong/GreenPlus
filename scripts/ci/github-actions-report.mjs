/** Read-only CI/CD run report. Uses GitHub's job/step *metadata* only.
 * Never downloads or archives raw logs, workflow artifacts or credentials.
 * The workflow executes this script from the trusted default branch.
 */
import { readFile, mkdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const clean = v => String(v??'').replace(/[\r\n|<>\[\]`]/g,' ').replace(/\b((?:token|secret|password|api[_ -]?key)\s*[:=]\s*)[^\s]+/gi,'$1[REDACTED]').replace(/\s+/g,' ').slice(0,160);
const badges={success:'✅ PASS',failure:'❌ FAIL',cancelled:'🛑 CANCELLED',skipped:'⏭️ SKIPPED',timed_out:'❌ TIMEOUT',action_required:'❌ ACTION REQUIRED',in_progress:'⏳ RUNNING',queued:'⏳ QUEUED'};
const label = v => badges[v] || `❔ ${clean(v||'UNKNOWN')}`;
const safeId = v => Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):null;
const safeRepo = v => /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(v||'');
const validSha = v => /^[a-f0-9]{40}$/i.test(v||'');
const runLink = (repo,id) => safeRepo(repo)&&safeId(id)?`https://github.com/${repo}/actions/runs/${safeId(id)}`:null;
const jobLink = (repo,runId,id) => runLink(repo,runId)&&safeId(id)?`${runLink(repo,runId)}/job/${safeId(id)}`:null;
const safeDate = v => Number.isFinite(Date.parse(v||''))?new Date(v).toISOString():null;
function duration(start,end) {
  const a=Date.parse(start||''),b=Date.parse(end||'');
  if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)return null;
  return Math.round((b-a)/1000);
}
function fmtDuration(seconds){
  if(seconds===null)return '—';
  const min=Math.floor(seconds/60),sec=seconds%60;
  return min ? `${min}m ${sec}s` : `${sec}s`;
}
const sanitizeStep = (s,i) => ({
  number: Number.isSafeInteger(s.number)&&s.number>0?s.number:i+1,
  name: clean(s.name),
  status: clean(s.status||'unknown'),
  conclusion: clean(s.conclusion||'unknown'),
  started_at:safeDate(s.started_at),
  completed_at:safeDate(s.completed_at),
  duration_seconds:duration(s.started_at,s.completed_at),
});
const sanitizeJob = j => ({
  name:clean(j.name), conclusion:clean(j.conclusion||'unknown'), status:clean(j.status||'unknown'), id:safeId(j.id),
  started_at:safeDate(j.started_at), completed_at:safeDate(j.completed_at),
  duration_seconds:duration(j.started_at,j.completed_at),
  steps:Array.isArray(j.steps)?j.steps.map(sanitizeStep):[],
});

export async function fetchWorkflowJobs({repo,runId,token,fetcher=fetch}){
  if(!safeRepo(repo)||!safeId(runId)||!token)throw new Error('Missing or invalid workflow run context');
  const jobs=[];
  for(let page=1;page<=10;page++){
    const url=`https://api.github.com/repos/${repo}/actions/runs/${Number(runId)}/jobs?per_page=100&page=${page}`;
    const resp=await fetcher(url,{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!resp.ok)throw new Error(`GitHub API returned HTTP ${resp.status}`);
    const data=await resp.json();
    if(!Array.isArray(data.jobs))throw new Error('Invalid GitHub API jobs response');
    jobs.push(...data.jobs.map(sanitizeJob));
    if(data.jobs.length<100)return jobs;
  }
  throw new Error('Too many jobs: pagination limit reached');
}

export function buildActionReport(run,jobs){
  const summary={ success:0, failure:0, skipped:0, cancelled:0, other:0 };
  const safeJobs=jobs.map(sanitizeJob);
  for(const job of safeJobs){
    if(job.conclusion in summary)summary[job.conclusion]++;
    else summary.other++;
  }
  const firstFailures=safeJobs.filter(j=>['failure','timed_out','cancelled','action_required'].includes(j.conclusion))
    .map(j=>({job:j.name,job_id:j.id,first_failed_step:j.steps.find(s=>['failure','timed_out','cancelled','action_required'].includes(s.conclusion))?.name||null}));
  return {
    schema_version:2,
    kind:'github_actions_detailed_run',
    run:{id:safeId(run?.id),url:runLink(run?.repository?.full_name||'',run?.id),name:clean(run?.name),title:clean(run?.display_title),conclusion:clean(run?.conclusion||'unknown'),event:clean(run?.event||'unknown'),head_sha:validSha(run?.head_sha)?run.head_sha:null,head_branch:clean(run?.head_branch),run_attempt:safeId(run?.run_attempt),created_at:safeDate(run?.created_at),updated_at:safeDate(run?.updated_at)},
    totals:summary,failures:firstFailures,jobs:safeJobs.map(job=>({...job,url:jobLink(run?.repository?.full_name||'',run?.id,job.id)})),
    notes:['Job/step outcomes come from GitHub Actions API, not parsed log contents.', 'A successful reporting workflow does not change the original workflow conclusion.', 'No raw logs, tokens, artifacts or secret values are downloaded.'],
  };
}

export function renderActionReport(run,jobs){
  const report=buildActionReport(run,jobs),{totals}=report;
  const repo=run?.repository?.full_name||'';
  const url=runLink(repo,run?.id);
  const lines=[
    '# GreenPlus · CI/CD Detailed Flow Report','',
    `**Workflow:** ${clean(run?.name||'Unknown')}  `,
    `**Original result:** ${label(run?.conclusion)}  `,
    `**Branch:** ${clean(run?.head_branch||'-')}  `,
    `**Commit:** \`${validSha(run?.head_sha)?run.head_sha:clean(run?.head_sha||'-')}\`  `,
    `**Trigger:** ${clean(run?.event||'unknown')} · **Attempt:** ${safeId(run?.run_attempt)||'—'}  `,
    `**Run created (UTC):** ${safeDate(run?.created_at)||'—'}  `,
    '',...(url?[`**[Open original workflow run](${url})**`,'']:[]),
    '## 1. Executive outcome','',
    `**Jobs:** ${jobs.length} total · ${totals.success} pass · ${totals.failure} fail · ${totals.skipped} skipped · ${totals.cancelled} cancelled · ${totals.other} other.`,
    '',
    'A red original run is NOT fixed by a green report-generation run. Skipped publishing is not a PASS.',
    '',
    '## 2. Job execution flow','',
    '| Job | Result | Runtime | Steps passed / failed / skipped | First failed step | Logs |',
    '|---|---|---|---|---|---|',
  ];
  for(const j of report.jobs){
    const steps=j.steps, passed=steps.filter(s=>s.conclusion==='success').length,
      failed=steps.filter(s=>['failure','timed_out','cancelled'].includes(s.conclusion)).length,
      skipped=steps.filter(s=>s.conclusion==='skipped').length;
    const first=steps.find(s=>['failure','timed_out','cancelled','action_required'].includes(s.conclusion));
    const href=jobLink(repo,run?.id,j.id);
    lines.push(`| ${j.name} | ${label(j.conclusion)} | ${fmtDuration(j.duration_seconds)} | ${passed} / ${failed} / ${skipped} | ${clean(first?.name|| (j.conclusion==='failure'?'See job logs':'—'))} | ${href?`[Open job](${href})`:'—'} |`);
  }
  lines.push('','## 3. Failed and blocked stages','');
  if(!report.failures.length)lines.push('No failed job in the GitHub API result. Check pending/skipped jobs separately.');
  for(const f of report.failures){
    const href=jobLink(repo,run?.id,f.job_id);
    lines.push(`- **${f.job}** · ${f.first_failed_step?`first failed step: **${f.first_failed_step}**`:'no failed step metadata available'}${href?` · [Open exact job logs](${href})`:''}`);
  }
  lines.push('',
    '## 4. Detailed steps per job','',
    'Steps are presented in GitHub execution order. A skipped step means it was not executed, typically because a dependency failed or a workflow condition did not match.');
  for(const j of report.jobs){
    const href=jobLink(repo,run?.id,j.id);
    lines.push('',`### ${j.name} — ${label(j.conclusion)}`,'',
      `**Job log:** ${href?`[View original steps and stderr](${href})`:'Unavailable'}`,'');
    if(!j.steps.length){lines.push('Step metadata unavailable; the report does not infer PASS or FAIL for individual steps.');continue;}
    lines.push('| # | Step | Status | Conclusion | Duration |','|---:|---|---|---|---:|');
    for(const s of j.steps)lines.push(`| ${s.number} | ${s.name} | ${clean(s.status)} | ${label(s.conclusion)} | ${fmtDuration(s.duration_seconds)} |`);
  }
  lines.push('', '## 5. Interpretation and next actions','',
    '- **Typecheck/build/test FAIL:** code or test failure; open the first failed step log to identify the actual error. A missing secret cannot be assumed.',
    '- **Migration policy FAIL:** compare immutable migration bytes/checksums with the reviewed baseline; do not regenerate a lock from untrusted edited SQL.',
    '- **pgTAP/RLS FAIL:** verify database grants and SQL migration history in disposable/staging DB; do not relax the test simply to pass.',
    '- **Lint warnings:** visible quality debt. They are not typecheck, build or security evidence.',
    '- **SKIPPED publishing/deploy:** no image or deployment success is implied. Release remains blocked if upstream mandatory gates failed.',
    '- **Environment/provider warnings:** diagnose credentials/network separately from code, using job step conclusions and original logs.',
    '',
    '**Evidence limits:** This file contains GitHub API job/step metadata and links only. It does not download raw job logs or expose secrets. The exact compiler/SQL error text remains in the original job logs.',
    '',
    '**Service availability:** Services CI reports third-party connectivity as warnings and does not override code/security gates.',
    '**Meaning:** This reporting run being green does not imply the original run passed. Always check **Original result**.', '');
  return lines.join('\n');
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
  const run=event.workflow_run;
  if(!run)throw Error('This report requires a completed workflow_run event');
  const repo=run.repository?.full_name||process.env.GITHUB_REPOSITORY;
  const jobs=await fetchWorkflowJobs({repo,runId:run.id,token:process.env.GITHUB_TOKEN});
  const report=buildActionReport(run,jobs);
  const output='artifacts/ci/actions-report.json';
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  const markdown=renderActionReport(run,jobs);
  await writeFile('artifacts/ci/actions-report.md',markdown);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,markdown);
  console.log(markdown);
}
