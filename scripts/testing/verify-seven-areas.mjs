#!/usr/bin/env node
/**
 * GreenPlus v2.0: one invocation, seven product-area verification reports plus
 * the required CI/CD safety gate. Read-only by default. Does not deploy,
 * migrate production, create orders, charge payments, or generate signing keys.
 *
 * Usage: node scripts/testing/verify-seven-areas.mjs [--full] [--browser]
 *        [--staging] [--docker] [--android] [--strict]
 * External actions are opt-in and use preconfigured deployments/credentials.
 */
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT=resolve(import.meta.dirname,'../..');
const REPORT_DIR=resolve(ROOT,'artifacts/testing/seven-areas');
const NODE=process.execPath;
const FLAGS=new Set(['--full','--browser','--staging','--docker','--android','--strict','--retry-failed','--ai-serverless','--lint-advisory','--skip-lint']);
export const AREAS=Object.freeze([
  '01 AI / online inference',
  '02 Mobile / Android',
  '03 Multi-tenancy / PostgreSQL',
  '04 Features / security / realtime',
  '05 Code architecture / performance',
  '06 Frontend / responsive / accessibility',
  '07 Sentry / Better Stack',
  '08 CI/CD / migration safety',
]);
export function parseOptions(args){
  if(args.some(a=>!FLAGS.has(a)))throw Error('Invalid option. Use --full --browser --staging --docker --android --strict.');
  const opts=new Set(args);
  return Object.fromEntries([...FLAGS].map(f=>[f.slice(2).replaceAll('-','_'),opts.has(f)]));
}
function check(label,cmd,args=[],extra={}){return {label,cmd,args,...extra};}
// Prefer Windows' Python launcher, then an explicitly configured interpreter, then PATH.
// A missing interpreter is a prerequisite, not evidence of failing FastAPI tests.
export function detectPython({platform=process.platform,env=process.env,probe}={}) {
  const candidates=[];
  if(env.GREENPLUS_PYTHON) candidates.push([env.GREENPLUS_PYTHON,[]]);
  if(env.PYTHON) candidates.push([env.PYTHON,[]]);
  if(platform==='win32') candidates.push(['py',['-3']],['python',[]],['python3',[]]);
  else candidates.push(['python3',[]],['python',[]]);
  const run=probe||((cmd,args)=>spawnSync(cmd,[...args,'-c','import sys; print(sys.version_info[0])'],{encoding:'utf8',windowsHide:true,timeout:5000}));
  for(const [cmd,args] of candidates){
    const result=run(cmd,args);
    if(result && !result.error && result.status===0 && String(result.stdout??'').trim()==='3') return {cmd,args,available:true};
  }
  return {cmd:platform==='win32'?'py':'python3',args:platform==='win32'?['-3']:[],available:false,
    reason:platform==='win32'?'Python 3 unavailable. Install Python with the py launcher, then: py -3 -m pip install -r services/ai-assist/requirements.txt pytest':'Python 3 unavailable. Install Python 3 + pytest'};
}
const test=(label,pattern)=>check(label,NODE,['--experimental-strip-types','--test',pattern]);
const script=(label,path,...args)=>check(label,NODE,[path,...args]);
function qualitySteps(app){
  const cwd=join(ROOT,`web-${app}`);
  const installed=existsSync(join(ROOT,'node_modules/typescript/bin/tsc'))&&existsSync(join(ROOT,'node_modules/eslint/bin/eslint.js'))&&existsSync(join(ROOT,'node_modules/next/dist/bin/next'));
  return [
    check(`${app} ESLint`,NODE,[join(ROOT,'node_modules/eslint/bin/eslint.js'),'--cache','--cache-strategy','content','--cache-location',join(ROOT,'.cache',`eslint-${app}.cache`)],{cwd,available:installed,timeoutMs:720000}),
    check(`${app} typecheck`,NODE,[join(ROOT,'node_modules/typescript/bin/tsc'),'--noEmit'],{cwd,available:installed,timeoutMs:240000}),
    check(`${app} production build`,NODE,[join(ROOT,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd,available:installed,timeoutMs:1800000}),
  ];
}
export function createPlan(options){
  const browser=options.browser;
  const staging=options.staging;
  const docker=options.docker;
  const android=options.android;
  const full=options.full;
  const serverless=options.ai_serverless || process.env.GREENPLUS_AI_RUNTIME==='serverless';
  // Do not even probe local Python when the selected runtime is Node/Vercel.
  const python=serverless?null:detectPython();
  const plan=[
    {area:AREAS[0],checks:[
      test('AI contracts and quality evaluation','tests/ai-*.test.mjs'),
      test('AI network integration','tests/integration/ai-http.integration.test.mjs'),
      ...(serverless?[
        test('Serverless AI runtime tests','tests/ai-serverless-runtime.test.mjs'),
        check('FastAPI AI unit tests',NODE,[],{applicable:false,reason:'NOT APPLICABLE: the selected AI runtime is serverless (Next.js). This does not certify the optional Python/FastAPI service.'}),
      ]:[check('FastAPI AI unit tests',python.cmd,[...python.args,'-m','pytest','-q','services/ai-assist/tests'],{available:python.available,reason:python.reason,timeoutMs:180000,env:{PYTHONPATH:join(ROOT,'services/ai-assist')}})]),
    ]},
    {area:AREAS[1],checks:[
      test('Mobile PWA, TWA and Digital Asset Links static tests','tests/mobile-*.test.mjs'),
      ...(staging?['client','shipper'].map(app=>check(`${app} hosted PWA + Digital Asset Links`,NODE,['scripts/mobile-release-check.mjs',app,process.env[`GREENPLUS_STAGING_${app.toUpperCase()}_URL`]||'','--twa'],{available:!!process.env[`GREENPLUS_STAGING_${app.toUpperCase()}_URL`],reason:`Set GREENPLUS_STAGING_${app.toUpperCase()}_URL to HTTPS origin`})):[]),
      ...(android?['client','shipper'].map(app=>check(`${app} signed APK certificate verification`,NODE,['scripts/testing/verify-android-apk.mjs',app,process.env[`GREENPLUS_${app.toUpperCase()}_APK`]||''],{available:!!process.env[`GREENPLUS_${app.toUpperCase()}_APK`],reason:`Set GREENPLUS_${app.toUpperCase()}_APK`})):[]),
    ]},
    {area:AREAS[2],checks:[
      test('Tenant/Postgres adapter and provider parity','tests/tenant-*.test.mjs'),
      script('Immutable Supabase migration gate','scripts/ci/supabase-migration-gate.mjs','--static'),
      script('Supabase storage offline contract','scripts/ci/check-storage.mjs'),
      ...(docker?[check('Running Docker Three-tier DB parity',NODE,['scripts/ci/three-tier-parity-audit.mjs'],{timeoutMs:120000})]:[]),
    ]},
    {area:AREAS[3],checks:[
      test('Tenant-scoped human support / policy','tests/live-support-contract.test.mjs'),
      test('Shipping fee / location tests','tests/delivery-location.test.mjs'),
      test('Auth / support HTTP integration','tests/integration/support-tenant.integration.test.mjs'),
      test('HTTP submission size / cross-origin integration','tests/integration/request-bounds.integration.test.mjs'),
      test('Client isolated business tests','web-client/tests/*.test.mjs'),
      check('Shipper business tests',NODE,['--test','web-shipper/tests/*.test.mjs'],{timeoutMs:180000}),
    ]},
    {area:AREAS[4],checks:[
      test('All root regression tests','tests/*.test.mjs'),
      test('Code and perf regression','tests/performance-cleanup.test.mjs'),
      ...(staging?[check('Safe bounded latency smoke for hosted health APIs',NODE,['scripts/testing/performance-smoke.mjs','--allow-remote','--samples','5','--admin',process.env.GREENPLUS_STAGING_ADMIN_URL||'','--client',process.env.GREENPLUS_STAGING_CLIENT_URL||'','--shipper',process.env.GREENPLUS_STAGING_SHIPPER_URL||''],{available:['GREENPLUS_STAGING_ADMIN_URL','GREENPLUS_STAGING_CLIENT_URL','GREENPLUS_STAGING_SHIPPER_URL'].every(k=>!!process.env[k]),reason:'Set three GREENPLUS_STAGING_*_URL HTTPS origins'})]:[]),
      // Run static gates first, then production builds; avoids costly build resource
      // pressure delaying ESLint and allows its cache on repeated verification.
      ...(full?['admin','client','shipper'].flatMap(app=>qualitySteps(app).slice(0,2).map(step=>step.label.endsWith(' ESLint') ? {...step,...(options.skip_lint?{advisorySkip:true}:{advisory:options.lint_advisory})}:step)):[]),
      ...(full?['admin','client','shipper'].map(app=>qualitySteps(app)[2]):[]),
    ]},
    {area:AREAS[5],checks:[
      test('Interface/theme source contracts','tests/theme-and-interface-contract.test.mjs'),
      ...(browser?['admin','client','shipper'].map(app=>check(`${app} Chromium browser E2E`,NODE,['node_modules/@playwright/test/cli.js','test','--config=playwright.ci.config.mts'],{env:{GREENPLUS_E2E_APP:app},timeoutMs:600000,available:existsSync(join(ROOT,'node_modules/@playwright/test/cli.js'))&&existsSync(join(ROOT,`web-${app}/.next/BUILD_ID`)),reason:'Install Playwright and run production builds first'})):[]),
    ]},
    {area:AREAS[6],checks:[
      test('PII redaction / telemetry integration','tests/integration/telemetry*.integration.test.mjs'),
      test('Sentry/Better Stack static contract','tests/lint-sentry-config.test.mjs'),
      script('Source security leak audit','scripts/testing/source-security-audit.mjs'),
    ]},
    {area:AREAS[7],checks:[
      script('CI/CD required-vs-advisory contracts','scripts/ci/validate-ci.mjs'),
      test('CI safety regression','tests/ci-*.test.mjs'),
      script('Patching Next.js security baseline','scripts/ci/dependency-version-gate.mjs'),
      ...(full?[script('Runtime dependency advisory (high/critical block, provider outages report warning)','scripts/ci/dependency-audit.mjs')]:[]),
      ...(staging?[check('Three hosted applications / unauthorized access',NODE,['scripts/testing/system-smoke.mjs','--allow-remote','--admin',process.env.GREENPLUS_STAGING_ADMIN_URL||'','--client',process.env.GREENPLUS_STAGING_CLIENT_URL||'','--shipper',process.env.GREENPLUS_STAGING_SHIPPER_URL||''],{available:['GREENPLUS_STAGING_ADMIN_URL','GREENPLUS_STAGING_CLIENT_URL','GREENPLUS_STAGING_SHIPPER_URL'].every(k=>!!process.env[k]),reason:'Set three GREENPLUS_STAGING_*_URL HTTPS origins'})]:[]),
    ]},
  ];
  return plan;
}
const SECRET_PATTERNS=[
  [/Bearer\s+[a-z0-9._~+\/-]{8,}/gi,'Bearer [REDACTED]'],
  [/\b(?:sk|sb_secret|ghp|gho|github_pat)_[a-z0-9_-]{12,}\b/gi,'[REDACTED_KEY]'],
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[REDACTED_EMAIL]'],
  [/\b(?:SUPABASE_SERVICE_ROLE_KEY|AI_LLM_KEY|BETTERSTACK_SOURCE_TOKEN|SENTRY_AUTH_TOKEN)\s*[:=]\s*\S+/gi,'[REDACTED_ENV]'],
  [/\b(?:postgres(?:ql)?:\/\/)[^\s]+/gi,'[REDACTED_DATABASE_URL]'],
  [/\b(?:https?:\/\/)[^\s\/]+:[^@\s]+@[^\s]+/gi,'[REDACTED_URL_CREDENTIALS]'],
];
export function redact(text){return SECRET_PATTERNS.reduce((v,[p,r])=>v.replace(p,r),String(text??''));}
export function diagnoseFailure(result){
  const raw=[result.stdout,result.stderr,result.error?.message].filter(Boolean).join('\n');
  const lines=raw.split(/\r?\n/);
  const selected=new Set();
  for(let i=0;i<lines.length;i++){
    if(/\berror\b|\bfail(?:ed)?\b|not ok|exception|timeout|timed out|TS\d{4}|ERR_|ENOENT|denied|\bproblems?\b|fatal|\bmodule not found\b/i.test(lines[i])){
      for(let j=Math.max(0,i-2);j<=Math.min(lines.length-1,i+2);j++)selected.add(j);
    }
  }
  // Preserve the last 45 lines even when the tool emits errors without the word 'error'.
  for(let j=Math.max(0,lines.length-45);j<lines.length;j++)selected.add(j);
  const selectedLines=[...selected].sort((a,b)=>a-b).map(i=>lines[i]).slice(-200);
  const prefix=result.error?`Process failure: ${result.error.code||result.error.message}\n`:'';
  return redact(prefix+selectedLines.join('\n')).slice(-28000);
}
function runStep(checkItem){
  if(checkItem.applicable===false)return {check:checkItem.label,status:'NOT_APPLICABLE',detail:checkItem.reason||'Inactive runtime',ms:0};
  if(checkItem.advisorySkip)return {check:checkItem.label,status:'ADVISORY',detail:'ESLint deliberately excluded from this local verification; not a PASS or proof of quality.',ms:0};
  if(checkItem.available===false)return {check:checkItem.label,status:'SKIPPED',detail:checkItem.reason||'Prerequisite missing',ms:0};
  const started=Date.now();
  const result=spawnSync(checkItem.cmd,checkItem.args,{cwd:checkItem.cwd||ROOT,encoding:'utf8',shell:false,windowsHide:true,maxBuffer:20*1024*1024,timeout:checkItem.timeoutMs||180000,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',...checkItem.env}});
  const failed=!!result.error||result.status!==0;
  const status=failed?(checkItem.advisory?'ADVISORY':'FAIL'):'PASS';
  const ms=Date.now()-started;
  const slug=checkItem.label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,72);
  // Default to summary-only logs for passing tests. Failures get a bounded,
  // redacted diagnostic subset; never persist full provider/DB response bodies.
  const diagnostics=status==='PASS'?'PASS (details intentionally not persisted)':diagnoseFailure(result);
  writeFileSync(join(REPORT_DIR,`${slug}.log`),(diagnostics||'FAIL (see terminal or run command manually)')+'\n');
  return {check:checkItem.label,status,detail:failed?(result.error?.code||`exit ${result.status}`):undefined,ms,log:`${slug}.log`};
}
export function selectFailedSteps(plan,previous){
  if(!Array.isArray(previous?.groups))throw Error('Invalid previous verification report');
  return plan.map(group=>({area:group.area,checks:group.checks.filter(step=>
    previous.groups.some(g=>g.area===group.area&&Array.isArray(g.checks)&&g.checks.some(old=>old.check===step.label&&old.status==='FAIL')))}))
    .filter(group=>group.checks.length>0);
}
export function summarize(results){
  return results.map(group=>({area:group.area,pass:group.checks.filter(c=>c.status==='PASS').length,fail:group.checks.filter(c=>c.status==='FAIL').length,skip:group.checks.filter(c=>c.status==='SKIPPED').length,advisory:group.checks.filter(c=>c.status==='ADVISORY').length,na:group.checks.filter(c=>c.status==='NOT_APPLICABLE').length,status:group.checks.some(c=>c.status==='FAIL')?'FAIL':group.checks.some(c=>c.status==='SKIPPED')?'INCOMPLETE':group.checks.some(c=>c.status==='ADVISORY')?'ADVISORY':'PASS'}));
}
function markdown(report){
  const summary=summarize(report.groups);
  return `# GreenPlus 7 product areas + CI/CD verification\n\nGenerated: ${report.generatedAt}\n\n${report.mode==='recheck'?'RECHECK MODE: only previously failed gates were executed; earlier PASS results were NOT re-verified.\n\n':''}This report proves only the gates **executed**. Offline tests cannot certify cloud deployment, signed Android devices or production permissions. No production data was modified.\n\n| Group | Result | Passed | Failed | Skipped | Advisory | Not applicable |\n|---|---|---:|---:|---:|---:|---:|\n${summary.map(g=>`| ${g.area} | **${g.status}** | ${g.pass} | ${g.fail} | ${g.skip} | ${g.advisory} | ${g.na} |`).join('\n')}\n\n## Individual steps\n\n${report.groups.map(g=>`### ${g.area}\n\n| Check | Status | Duration | Local log |\n|---|---|---:|---|\n${g.checks.map(c=>`| ${c.check.replaceAll('|','/')} | ${c.status} | ${c.ms} ms | ${c.log||c.detail||'-'} |`).join('\n')}`).join('\n\n')}\n\nADVISORY is an explicitly acknowledged non-blocking check, not a PASS; --skip-lint also records ADVISORY rather than hiding the check. This local option never changes the repository's required GitHub Actions gates.\n\nNOT_APPLICABLE is explicitly excluded from the selected runtime (for example, Python FastAPI when using AI serverless); it is **not** a PASS for that component. Any SKIPPED check remains unverified. Run --strict to make missing prerequisites block the verification result.\n`;
}
export function saveReport(report,{recheck=false}={}){
  mkdirSync(REPORT_DIR,{recursive:true});
  const stem=recheck?'recheck-report':'report';
  const json=join(REPORT_DIR,`${stem}.json`),md=join(REPORT_DIR,`${stem}.md`);
  writeFileSync(json,JSON.stringify(report,null,2)+'\n');writeFileSync(md,markdown(report));
  return {json,md};
}
/** Merge the old complete run with exactly the gates re-executed later.
 * Carried-forward PASS is explicitly marked, never presented as freshly tested. */
export function combineVerification(base,recheck) {
  if(!Array.isArray(base?.groups)||!Array.isArray(recheck?.groups)||recheck.mode!=='recheck')
    throw Error('Cannot combine invalid verification reports');
  const replaced=new Set();
  const groups=base.groups.map(group=>({
    area:group.area,
    checks:group.checks.map(original=>{
      const updated=recheck.groups.find(g=>g.area===group.area)?.checks?.find(c=>c.check===original.check);
      if(updated){replaced.add(`${group.area}\0${original.check}`);return {...updated,evidence:'rechecked',verifiedAt:recheck.generatedAt};}
      return {...original,evidence:'carried_forward',verifiedAt:original.verifiedAt??base.generatedAt};
    }),
  }));
  for(const group of recheck.groups){
    const target=groups.find(g=>g.area===group.area);
    if(!target)throw Error(`Unexpected recheck area: ${group.area}`);
    for(const row of group.checks)if(!replaced.has(`${group.area}\0${row.check}`))
      throw Error(`Unexpected recheck gate: ${row.check}`);
  }
  return {schemaVersion:1,mode:'combined',baseReportGeneratedAt:base.baseReportGeneratedAt??base.generatedAt,
    generatedAt:recheck.generatedAt,aiRuntime:recheck.aiRuntime,options:recheck.options,
    note:'Original PASS results were carried forward, not re-executed. Only evidence=rechecked represents this retry.',groups};
}
function saveCombinedReport(report) {
  const json=join(REPORT_DIR,'combined-report.json'),md=join(REPORT_DIR,'combined-report.md');
  writeFileSync(json,JSON.stringify(report,null,2)+'\n');
  writeFileSync(md,markdown(report)+'\n\n## Evidence provenance\n\nCarried-forward PASS means this check passed only in the original run. Rechecked results are from the latest retry. No untested gate is counted as PASS.\n');
  return {json,md};
}
export async function main(args=process.argv.slice(2)){
  const options=parseOptions(args);
  if(options.skip_lint&&options.lint_advisory)throw Error('Choose --skip-lint OR --lint-advisory, not both.');
  mkdirSync(REPORT_DIR,{recursive:true});
  mkdirSync(join(ROOT,'.cache'),{recursive:true});
  const groups=[];
  let plan=createPlan(options);
  let retryBase=null;
  if(options.retry_failed){
    const previousPath=join(REPORT_DIR,'report.json');
    if(!existsSync(previousPath)) throw Error('Cannot recheck: artifacts/testing/seven-areas/report.json is missing. Run the standard verification first.');
    const previous=JSON.parse(readFileSync(previousPath,'utf8'));
    const combinedPath=join(REPORT_DIR,'combined-report.json');
    let latest=previous;
    if(existsSync(combinedPath)){
      const candidate=JSON.parse(readFileSync(combinedPath,'utf8'));
      if(candidate.baseReportGeneratedAt===previous.generatedAt)latest=candidate;
    }
    retryBase=latest;
    plan=selectFailedSteps(plan,latest);
    if(!plan.length)throw Error('No previously failed checks match the selected options.');
    console.log('RECHECK: running only previously failed gates. Original report.json will be preserved.');
  }
  for(const group of plan){
    console.log(`\n## ${group.area}`);
    const checks=group.checks.map(c=>{
      const result=runStep(c);
      console.log(`${result.status.padEnd(10)} ${result.check} (${result.ms} ms)`);
      return result;
    });
    groups.push({area:group.area,checks});
  }
  const report={schemaVersion:1,mode:options.retry_failed?'recheck':'full',aiRuntime:options.ai_serverless||process.env.GREENPLUS_AI_RUNTIME==='serverless'?'serverless':'fastapi',generatedAt:new Date().toISOString(),options,groups};
  const paths=saveReport(report,{recheck:options.retry_failed}),summary=summarize(groups);
  if(options.retry_failed&&retryBase) {
    const combined=combineVerification(retryBase,report);
    const saved=saveCombinedReport(combined);
    console.log(`Consolidated report (with carried-forward evidence): ${saved.md}`);
  }
  const failed=summary.some(s=>s.status==='FAIL');
  const incomplete=summary.some(s=>s.status==='INCOMPLETE');
  console.log(`\nGreenPlus ${options.retry_failed?'recheck':'verification'}: ${summary.filter(s=>s.status==='PASS').length}/${summary.length} selected areas fully PASS, ${summary.filter(s=>s.status==='FAIL').length} FAIL, ${summary.filter(s=>s.status==='INCOMPLETE').length} INCOMPLETE, ${summary.filter(s=>s.status==='ADVISORY').length} ADVISORY`);
  console.log(`Report: ${paths.md}`);
  if(failed||(options.strict&&incomplete))process.exitCode=1;
  return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(e=>{console.error(`GreenPlus verification setup error: ${e.message}`);process.exitCode=2;});
}
