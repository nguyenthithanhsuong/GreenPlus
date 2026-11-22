#!/usr/bin/env node
/** GreenPlus read-only HTTP smoke gate. Never submits orders or authentication credentials. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_URLS = Object.freeze({admin:'http://127.0.0.1:3000',client:'http://127.0.0.1:3001',shipper:'http://127.0.0.1:3002'});
const PUBLIC_PATHS = Object.freeze(['/api/health','/login']);
const AUTH_PATHS = Object.freeze({
  admin:['/api/support/inquiries'],
  client:['/api/support/inquiries'],
  shipper:['/api/auth/me','/api/shipper/deliveries','/api/support/inquiries'],
});
function parseUrl(raw,allowRemote){
  const url=new URL(raw);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.hash||url.search||url.pathname!=='/')
    throw Error('Invalid smoke origin (expected origin URL only)');
  const localhost=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
  if(!localhost && (!allowRemote || url.protocol!=='https:'))throw Error('Remote smoke requires --allow-remote and HTTPS');
  return url.origin;
}
export function parseArguments(argv){
  const settings={urls:{...DEFAULT_URLS},allowRemote:false,timeoutMs:10000,report:'artifacts/testing/system-smoke.json'};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--allow-remote'){settings.allowRemote=true;continue;}
    if(['--admin','--client','--shipper','--report','--timeout-ms'].includes(arg)){
      if(!argv[i+1])throw Error(`Missing ${arg} value`);
      const value=argv[++i];
      if(arg==='--report')settings.report=value;
      else if(arg==='--timeout-ms')settings.timeoutMs=Number(value);
      else settings.urls[arg.slice(2)]=value;
      continue;
    }
    throw Error(`Unknown argument: ${arg}`);
  }
  if(!Number.isInteger(settings.timeoutMs)||settings.timeoutMs<500||settings.timeoutMs>30000)throw Error('Invalid smoke timeout');
  for(const [app,url] of Object.entries(settings.urls))settings.urls[app]=parseUrl(url,settings.allowRemote);
  if(!settings.report||settings.report.startsWith('-'))throw Error('Invalid report path');
  return settings;
}
async function probe(fetchImpl,base,path,expected,timeoutMs){
  const started=performance.now();
  try {
    const response=await fetchImpl(`${base}${path}`,{method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(timeoutMs),headers:{'User-Agent':'GreenPlus-CI-System-Smoke/1.0','Accept':'application/json,text/html'}});
    const actual=response.status;
    // Deliberately do not persist response bodies, cookies or raw headers.
    let schemaValid=true;
    if(path==='/api/health'&&actual===200){
      const body=await response.json().catch(()=>null);
      schemaValid=body?.status==='ok';
    }
    return {path,status:actual,expected,pass:expected.includes(actual)&&schemaValid,latencyMs:Math.round(performance.now()-started),...(schemaValid?{}:{detail:'Invalid health schema'})};
  } catch (error){
    return {path,status:null,expected,pass:false,latencyMs:Math.round(performance.now()-started),detail:error?.name==='TimeoutError'?'timeout':'connection_failed'};
  }
}
export async function runSystemSmoke(settings,{fetchImpl=fetch}={}){
  const checks=[];
  for(const [app,base] of Object.entries(settings.urls)){
    for(const path of PUBLIC_PATHS){
      const expected=path==='/login'?[200,307,308]:[200];
      checks.push({app,...await probe(fetchImpl,base,path,expected,settings.timeoutMs)});
    }
    for(const path of AUTH_PATHS[app]??[])checks.push({app,...await probe(fetchImpl,base,path,[401,403],settings.timeoutMs)});
  }
  return {schemaVersion:1,generatedAt:new Date().toISOString(),mode:settings.allowRemote?'remote-read-only':'local-read-only',total:checks.length,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,checks};
}
export function saveSmokeReport(report,path){
  const target=resolve(path);mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,JSON.stringify(report,null,2)+'\n');return target;
}
export async function main(argv=process.argv.slice(2),deps={}){
  const settings=parseArguments(argv);
  const report=await runSystemSmoke(settings,deps);
  const output=saveSmokeReport(report,settings.report);
  console.log(`GreenPlus System Smoke: ${report.passed}/${report.total} passed (${report.mode}). Report: ${output}`);
  for(const check of report.checks)console.log(`${check.pass?'PASS':'FAIL'} ${check.app} ${check.path}: ${check.status??check.detail} (${check.latencyMs}ms)`);
  if(report.failed>0)process.exitCode=1;
  return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(e=>{console.error(`Smoke configuration error: ${e.message}`);process.exitCode=2;});
}
