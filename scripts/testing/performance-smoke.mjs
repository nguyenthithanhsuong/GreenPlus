#!/usr/bin/env node
/** Bounded, read-only performance sample. Not a stress/load test. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArguments as parseSmokeArguments} from './system-smoke.mjs';
export function parsePerformanceArguments(argv){
 const countIndex=argv.indexOf('--samples');
 let samples=8;
 const filtered=[...argv];
 if(countIndex>=0){samples=Number(filtered[countIndex+1]);filtered.splice(countIndex,2);}
 if(!Number.isInteger(samples)||samples<2||samples>20)throw Error('samples must be 2..20');
 const settings=parseSmokeArguments(filtered);
 if(settings.allowRemote&&samples>8)throw Error('remote smoke limited to 8 samples per app');
 return {...settings,samples};
}
function percentile(values,p){return values[Math.max(0,Math.ceil(values.length*p)-1)];}
export async function runPerformanceSmoke(settings,{fetchImpl=fetch}={}){
 const details=[];
 for(const [app,base] of Object.entries(settings.urls)){
  const times=[];let failures=0;
  for(let i=0;i<settings.samples;i++){
   const start=performance.now();
   try{
    const response=await fetchImpl(`${base}/api/health`,{
     method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(settings.timeoutMs),
     headers:{'Accept':'application/json','User-Agent':'GreenPlus-ReadOnly-PerfSmoke/1.0'}
    });
    const payload=response.status===200?await response.json().catch(()=>null):null;
    if(response.status!==200||payload?.status!=='ok')failures++;
   }catch{failures++;}
   times.push(Math.round(performance.now()-start));
  }
  times.sort((a,b)=>a-b);
  details.push({app,samples:settings.samples,failures,p50Ms:percentile(times,0.5),p95Ms:percentile(times,0.95),maxMs:times.at(-1)});
 }
 return {schemaVersion:1,mode:settings.allowRemote?'remote-read-only':'local-read-only',generatedAt:new Date().toISOString(),
   note:'Low-volume health endpoint diagnostic, NOT a representative load test or performance guarantee',
   pass:details.every(row=>row.failures===0),details};
}
export async function main(argv=process.argv.slice(2)){
 const settings=parsePerformanceArguments(argv);
 const report=await runPerformanceSmoke(settings);
 const target=resolve('artifacts/testing/performance-smoke.json');mkdirSync(resolve(target,'..'),{recursive:true});
 writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 for(const row of report.details)console.log(`${row.app}: p50=${row.p50Ms}ms p95=${row.p95Ms}ms failures=${row.failures}/${row.samples}`);
 console.log(`Report: ${target}`);
 if(!report.pass)process.exitCode=1;
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(e=>{console.error(`Perf smoke error: ${e.message}`);process.exitCode=2;});
