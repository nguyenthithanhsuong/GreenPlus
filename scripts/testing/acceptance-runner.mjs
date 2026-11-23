#!/usr/bin/env node
/** One-pass acceptance runner. Offline by default. Does NOT migrate or deploy. */
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'../..');
export function parseOptions(args){
 const selected=new Set(args);
 for(const arg of selected)if(!['--full','--quick','--with-browser','--ai-serverless'].includes(arg))throw Error(`Unknown option ${arg}`);
 if(selected.has('--quick')&&selected.has('--full'))throw Error('Choose --quick or --full');
 return {full:selected.has('--full'),browser:selected.has('--with-browser'),...(selected.has('--ai-serverless')?{aiServerless:true}:{})};
}
function run(name,program,args,{cwd=root,timeout=180000,available=true,env={}}={}){
 if(!available)return {name,status:'SKIPPED',reason:'Dependency not installed (run npm ci / pip install)',durationMs:0};
 const start=Date.now();
 const result=spawnSync(program,args,{cwd,encoding:'utf8',timeout,maxBuffer:30*1024*1024,windowsHide:true,shell:false,env:{...process.env,...env,NEXT_TELEMETRY_DISABLED:'1'}});
 const status=result.error||result.status!==0?'FAIL':'PASS';
 // Report bounded, redacted classification only; raw stdout/stderr stays in local terminal.
 const detail=result.error?.code==='ETIMEDOUT'?'timeout':result.error?.code??`exit ${result.status}`;
 console.log(`${status.padEnd(7)} ${name} (${Date.now()-start}ms)`);
 if(status==='FAIL')console.error(`${name}: ${detail}. Rerun the failed command directly to inspect its diagnostic output.`);
 return {name,status,durationMs:Date.now()-start,...(status==='FAIL'?{detail}:{})};
}
export function createPlan(options){
 const node=process.execPath;
 const core=[
  ['Root Node unit & contract',node,['--experimental-strip-types','--test','tests/*.test.mjs']],
  ['HTTP/API/telemetry integration',node,['--experimental-strip-types','--test','tests/integration/*.test.mjs']],
  ['Client isolated tests',node,['--experimental-strip-types','--test','web-client/tests/*.test.mjs']],
  ['Shipper isolated tests',node,['--test','web-shipper/tests/*.test.mjs']],
  ['CI/CD static guard',node,['scripts/ci/validate-ci.mjs']],
  ['Supabase immutable migration gate',node,['scripts/ci/supabase-migration-gate.mjs','--static']],
  ['Static security audit',node,['scripts/testing/source-security-audit.mjs']],
 ];
 return core;
}
function prettyMarkdown(report){
 return `# GreenPlus · Acceptance Report\n\n- Generated: ${report.generatedAt}\n- Mode: ${report.mode}\n- AI runtime: ${report.aiRuntime} (NOT_APPLICABLE is not a test PASS)\n- Result: **${report.failed?'FAIL':report.skipped?'INCOMPLETE':'PASS'}** (${report.passed} pass / ${report.failed} fail / ${report.skipped} skipped)\n- This is **not** a production E2E certification. External providers and device APK require separate staging verification.\n\n| Check | Result | Duration (ms) |\n|---|---|---:|\n${report.steps.map(s=>`| ${s.name} | ${s.status} | ${s.durationMs} |`).join('\n')}\n\nNo migrations or production mutations were performed. Use scripts/testing/verify-seven-areas.mjs to run grouped checks.\n`;
}
export function saveReport(report){
 const dir=resolve(root,'artifacts/testing');mkdirSync(dir,{recursive:true});
 const json=resolve(dir,'acceptance-report.json'),md=resolve(dir,'acceptance-report.md');
 writeFileSync(json,JSON.stringify(report,null,2)+'\n');writeFileSync(md,prettyMarkdown(report));
 console.log(`Report: ${md}`);return md;
}
export async function main(argv=process.argv.slice(2)){
 const options=parseOptions(argv);const steps=[];const node=process.execPath;
 for(const [name,prog,args] of createPlan(options))steps.push(run(name,prog,args));
 const aiServerless=options.aiServerless||process.env.GREENPLUS_AI_RUNTIME==='serverless';
 if(aiServerless){
  steps.push(run('Serverless AI runtime tests',node,['--experimental-strip-types','--test','tests/ai-serverless-runtime.test.mjs']));
  steps.push({name:'Python AI unit tests (inactive runtime)',status:'NOT_APPLICABLE',reason:'Not required by the selected Next.js serverless AI runtime',durationMs:0});
 }else{
  const py=process.env.PYTHON??'python';
  steps.push(run('Python AI unit tests',py,['-m','pytest','-q','services/ai-assist/tests'],{timeout:90000,available:!process.env.GREENPLUS_SKIP_PYTHON,env:{PYTHONPATH:resolve(root,'services/ai-assist')}}));
 }
 if(options.full){
  for(const app of ['web-admin','web-client','web-shipper']){
   const installed=existsSync(resolve(root,'node_modules/typescript/bin/tsc'))&&existsSync(resolve(root,'node_modules/eslint/bin/eslint.js'))&&existsSync(resolve(root,'node_modules/next/dist/bin/next'));
   steps.push(run(`${app}: ESLint`,node,[resolve(root,'node_modules/eslint/bin/eslint.js')],{cwd:resolve(root,app),available:installed,timeout:180000}));
   steps.push(run(`${app}: TypeScript`,node,[resolve(root,'node_modules/typescript/bin/tsc'),'--noEmit'],{cwd:resolve(root,app),available:installed,timeout:180000}));
   steps.push(run(`${app}: Next production build`,node,[resolve(root,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:resolve(root,app),available:installed,timeout:1200000}));
  }
 }
 if(options.browser){
  const installed=existsSync(resolve(root,'node_modules/@playwright/test/cli.js'));
  for(const app of ['admin','client','shipper']){
   steps.push(run(`${app}: Browser Playwright E2E`,node,[resolve(root,'node_modules/@playwright/test/cli.js'),'test','--config=playwright.ci.config.mts'],{available:installed,timeout:360000,env:{GREENPLUS_E2E_APP:app}}));
  }
 }
 const report={schemaVersion:1,generatedAt:new Date().toISOString(),mode:options.full?'full-offline':'quick-offline',aiRuntime:aiServerless?'serverless':'fastapi',steps,passed:steps.filter(s=>s.status==='PASS').length,failed:steps.filter(s=>s.status==='FAIL').length,skipped:steps.filter(s=>s.status==='SKIPPED').length};
 saveReport(report);if(report.failed || (options.full&&report.skipped))process.exitCode=1;
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(err=>{console.error(err.message);process.exitCode=2;});
