/** Collects every workspace lint/typecheck failure instead of stopping at the first.
 * Dependency install is a prerequisite (npm ci). No auto-fix or config weakening.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const tasks=['admin','client','shipper'].flatMap(app=>['lint','typecheck'].map(command=>({app,command})));
export async function runTask(task,{runner}={}){
  if(runner)return runner(task);
  return new Promise(resolve=>{
    // Every task comes from a fixed local allowlist. Use cmd.exe explicitly on
    // Windows so Node does not emit DEP0190 for `shell: true` + arguments.
    if (!tasks.some(entry=>entry.app===task.app && entry.command===task.command)) {
      resolve({app:task.app,command:task.command,status:'error',reason:'UNSUPPORTED_TASK'});
      return;
    }
    const onWindows=process.platform==='win32';
    const program=onWindows?(process.env.ComSpec||'cmd.exe'):'npm';
    const args=onWindows
      ? ['/d','/s','/c',`npm run ${task.command} -w web-${task.app}`]
      : ['run',task.command,'-w',`web-${task.app}`];
    const child=spawn(program,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});
    let output='';
    child.stdout.on('data',v=>{process.stdout.write(v);output+=v;});
    child.stderr.on('data',v=>{process.stderr.write(v);output+=v;});
    child.on('error',error=>resolve({app:task.app,command:task.command,status:'error',reason:error.code||'SPAWN_ERROR'}));
    child.on('close',code=>resolve({app:task.app,command:task.command,status:code===0?'pass':'fail',exitCode:code,details:output.slice(-6000)}));
  });
}

const clean=v=>String(v??'').replace(/[|\n\r<>]/g,' ').slice(0,120);
export function renderQualityReport(rows){
  const lines=['# GreenPlus · Lint / Typecheck','', '| App | Check | Result |','|---|---|---|'];
  for(const r of rows)lines.push(`| web-${clean(r.app)} | ${clean(r.command)} | ${r.status==='pass'?'✅ PASS':'❌ '+clean(r.reason||r.status)} |`);
  lines.push('','All six checks are required. Any failed check returns a nonzero exit code; no errors are suppressed.','');
  return lines.join('\n');
}
export async function runQualityReport({runner=runTask,output='artifacts/ci/quality-report.json',summaryPath}={}){
  const rows=[];
  // Sequential deliberately: three Next.js workspaces concurrently can exhaust dev RAM.
  for(const task of tasks)rows.push(await runner(task));
  await mkdir('artifacts/ci',{recursive:true});
  // Do not upload raw ESLint output: it may include literals from application code.
  const safeRows=rows.map(({app,command,status,exitCode,reason})=>({app,command,status,exitCode,reason}));
  await writeFile(output,JSON.stringify(safeRows,null,2)+'\n');
  const report=renderQualityReport(rows);
  if(summaryPath)await appendFile(summaryPath,report);
  return {rows,report,ok:rows.every(x=>x.status==='pass')};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const eslintBin=resolve('node_modules','.bin',process.platform==='win32'?'eslint.cmd':'eslint');
  if(!existsSync(eslintBin)){
    console.error('BLOCKED: workspace dependencies are not installed. Run npm ci before ci:quality-report.');
    process.exitCode=2;
  }else{
  const result=await runQualityReport({summaryPath:process.env.GITHUB_STEP_SUMMARY});
  console.log(result.report);
  if(!result.ok)process.exitCode=1;
  }
}
