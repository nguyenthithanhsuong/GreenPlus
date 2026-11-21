/** Read-only dashboard for the GitHub Actions 'CI/CD Reports' workflow.
 * Fetches job CONCLUSIONS from GitHub API. Never checks out or executes run artifacts.
 */
import { readFile, mkdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const clean = v => String(v??'').replace(/[\r\n|<>\[\]`]/g,' ').slice(0,160);
const badges={success:'✅ PASS',failure:'❌ FAIL',cancelled:'🛑 CANCELLED',skipped:'⏭️ SKIPPED',timed_out:'❌ TIMEOUT',action_required:'❌ ACTION REQUIRED'};
const label = v => badges[v] || `❔ ${clean(v||'UNKNOWN')}`;
const safeId = v => Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):null;

export async function fetchWorkflowJobs({repo,runId,token,fetcher=fetch}){
  if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo||'') || !safeId(runId) || !token)throw new Error('Missing or invalid workflow run context');
  const jobs=[];
  for(let page=1;page<=10;page++){
    const url=`https://api.github.com/repos/${repo}/actions/runs/${Number(runId)}/jobs?per_page=100&page=${page}`;
    const resp=await fetcher(url,{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!resp.ok)throw new Error(`GitHub API returned HTTP ${resp.status}`);
    const data=await resp.json();
    if(!Array.isArray(data.jobs))throw new Error('Invalid GitHub API jobs response');
    jobs.push(...data.jobs.map(j=>({name:clean(j.name),conclusion:j.conclusion||'unknown',id:safeId(j.id)})));
    if(data.jobs.length<100)return jobs;
  }
  throw new Error('Too many jobs: pagination limit reached');
}

export function renderActionReport(run,jobs){
  const conclusion=run?.conclusion||'unknown';
  const repo=run?.repository?.full_name||'';
  const id=safeId(run?.id);
  const url=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)&&id?`https://github.com/${repo}/actions/runs/${id}`:null;
  const lines=[
    '# GreenPlus · CI/CD Reports','',
    `**Workflow:** ${clean(run?.name||'Unknown')}  `,
    `**Original result:** ${label(conclusion)}  `,
    `**Branch:** ${clean(run?.head_branch||'-')}  `,
    `**Commit:** \`${clean(run?.head_sha||'-')}\``,
    '',...(url?[`[Open original workflow run](${url})`,'']:[]),
    '| Job | Result |','|---|---|',
  ];
  for(const job of jobs)lines.push(`| ${clean(job.name)} | ${label(job.conclusion)} |`);
  lines.push('','**Service availability:** `Services CI` reports third-party connectivity as warnings and does not override code/security gates.','**Meaning:** This reporting run being green does not imply the original run passed. Always check **Original result**.','');
  return lines.join('\n');
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
  const run=event.workflow_run;
  if(!run)throw Error('This report requires a completed workflow_run event');
  const repo=run.repository?.full_name||process.env.GITHUB_REPOSITORY;
  const jobs=await fetchWorkflowJobs({repo,runId:run.id,token:process.env.GITHUB_TOKEN});
  const report={run:{id:run.id,name:run.name,conclusion:run.conclusion,head_sha:run.head_sha,head_branch:run.head_branch},jobs};
  const output='artifacts/ci/actions-report.json';
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  const markdown=renderActionReport(run,jobs);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,markdown);
  console.log(markdown);
}
