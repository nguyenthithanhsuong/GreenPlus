#!/usr/bin/env node
// Runs Bubblewrap against the *deployed* PWA. Does not require Android Studio IDE.
// GreenPlus never commits signing keys or SHA256 fingerprints.
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const project=resolve(import.meta.dirname,'..');
const target=process.argv[2], action=process.argv[3];
const aliases={client:'client-twa',shipper:'shipper-twa'};
if(!aliases[target]||!['init','build','install','assetlinks','check'].includes(action)){
 console.error('Usage: node scripts/mobile-twa.mjs <client|shipper> <init|build|install|assetlinks|check> [https://deployed-domain] [sha256-fingerprint]');
 process.exit(2);
}
const dir=resolve(project,'mobile',aliases[target]);mkdirSync(dir,{recursive:true});
function run(cmd,args){const x=spawnSync(cmd,args,{cwd:dir,stdio:'inherit',shell:process.platform==='win32'});if(x.error)throw x.error;process.exitCode=x.status||0;}
const site=process.argv[4];
if(action==='init'){
 let url;try{url=new URL(site);}catch{throw Error('Provide real deployed HTTPS origin as 4th argument.');}
 if(url.protocol!=='https:'||!url.hostname||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Use an HTTPS origin only, e.g. https://client.example.com/');
 console.log(`Packaging ${target} PWA: ${url.origin}/manifest.webmanifest`);
 console.log('Bubblewrap will prompt for package ID, icons, and Android signing settings. Keep your keystore outside Git.');
 run('npx',['--yes','@bubblewrap/cli','init',`--manifest=${url.origin}/manifest.webmanifest`]);
}else if(action==='build'||action==='install'){
 if(!existsSync(resolve(dir,'twa-manifest.json')))throw Error('Run init after deploying PWA first.');
 run('npx',['--yes','@bubblewrap/cli',action]);
}else if(action==='check'){
 if(!site)throw Error('Provide HTTPS origin');
 const url=new URL(site);if(url.protocol!=='https:')throw Error('HTTPS is required');
 const paths=['/manifest.webmanifest','/sw.js','/icons/icon-192.png','/icons/icon-512.png','/.well-known/assetlinks.json'];
 for(const path of paths){
  let response;
  try { response=await fetch(url.origin+path,{redirect:'manual',signal:AbortSignal.timeout(12000)}); }
  catch(error){console.error(path,error.message);process.exitCode=1;continue;}
  console.log(response.status,path,response.headers.get('content-type')||'');
  if(!response.ok){process.exitCode=1;continue;}
  if(path==='/manifest.webmanifest'){
   try { const m=await response.json();
    if(m.display!=='standalone'||!Array.isArray(m.icons)||!m.icons.some(i=>i.sizes?.includes('512')))
     throw Error('PWA manifest missing standalone display or 512px icon');
   }catch(error){console.error('Manifest invalid:',error.message);process.exitCode=1;}
  }
  if(path==='/.well-known/assetlinks.json'){
   try { const statements=await response.json();
    const requiredPackage=target==='client'?'com.greenplus.client':'com.greenplus.shipper';
    const valid=Array.isArray(statements)&&statements.some(s=>s?.relation?.includes('delegate_permission/common.handle_all_urls') && s?.target?.package_name===requiredPackage && s?.target?.sha256_cert_fingerprints?.some(x=>/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i.test(x)));
    if(!valid)throw Error(`Digital Asset Links missing ${requiredPackage} and its signing certificate fingerprint. Configure production GREENPLUS_TWA_*_SHA256.`);
   }catch(error){console.error('TWA verification invalid:',error.message);process.exitCode=1;}
  }
 }
}else if(action==='assetlinks'){
 // Android TWA uses SHA-256 of *signing certificate*, not API key or Google project ID.
 const source=resolve(dir,'twa-manifest.json');if(!existsSync(source))throw Error('Initialize TWA first.');
 const cfg=JSON.parse(readFileSync(source,'utf8'));
 const pkg=cfg.applicationId||cfg.packageId;
 const sha=process.argv[5];
 if(!pkg||!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i.test(sha||''))throw Error('Provide SHA256 signing certificate fingerprint as 5th argument, e.g. from keytool -list -v -keystore ...');
 const obj=[{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:pkg,sha256_cert_fingerprints:[sha.toUpperCase()]}}];
 const dest=resolve(dir,'assetlinks.generated.json');writeFileSync(dest,JSON.stringify(obj,null,2)+'\n');
 console.log('Generated',dest,'\nDeploy the JSON at the matching web origin: /.well-known/assetlinks.json');
}
