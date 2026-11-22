#!/usr/bin/env node
/** Read-only release inspection: validates package ID + verified signing on a built APK.
 * Requires Android SDK build-tools (aapt and apksigner). Never creates or reads a keystore.
 */
import {existsSync,statSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

export const PACKAGES=Object.freeze({client:'com.greenplus.client',shipper:'com.greenplus.shipper'});
export function parseBadging(text){
  const name=/^package:\s+name='([^']+)'/m.exec(text)?.[1];
  return name??null;
}
export function parseSignatures(text){
  const result={v2:/Verified using v2 scheme \(APK Signature Scheme v2\): true/i.test(text),v3:/Verified using v3 scheme \(APK Signature Scheme v3\): true/i.test(text),certSha256:/Signer #1 certificate SHA-256 digest:\s*([a-f0-9]+)/i.exec(text)?.[1]??null};
  return result;
}
export function androidBuildTools(sdkRoot=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT){
  if(!sdkRoot||!existsSync(join(sdkRoot,'build-tools')))return null;
  const root=join(sdkRoot,'build-tools');
  const versions=readdirSync(root).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
  for(const version of versions){
    const aapt=join(root,version,process.platform==='win32'?'aapt.exe':'aapt');
    const signerJar=join(root,version,'lib','apksigner.jar');
    if(existsSync(aapt)&&existsSync(signerJar))return {aapt,signerJar};
  }
  return null;
}
function run(tool,args){
  const result=spawnSync(tool,args,{encoding:'utf8',windowsHide:true,shell:false,timeout:30000,maxBuffer:2*1024*1024});
  if(result.error||result.status!==0)throw Error(`${tool} failed. Install Android SDK build-tools and place ${tool} on PATH.`);
  return result.stdout;
}
export function validateResults(app,badging,signing){
  const pkg=parseBadging(badging),sig=parseSignatures(signing);
  if(pkg!==PACKAGES[app])throw Error(`Unexpected Android package (${pkg??'missing'}), expected ${PACKAGES[app]}`);
  if(!sig.v2&&!sig.v3)throw Error('APK Signature Scheme v2/v3 verification failed');
  if(!sig.certSha256)throw Error('No verified signing certificate fingerprint');
  return {app,pkg,signingVerified:true,certFingerprint: sig.certSha256.toUpperCase().match(/.{2}/g).join(':')};
}
export function main(args=process.argv.slice(2)){
  const [app,path]=args;
  if(!Object.hasOwn(PACKAGES,app)||!path)throw Error('Usage: node scripts/testing/verify-android-apk.mjs <client|shipper> <signed.apk>');
  const target=resolve(path);
  if(!existsSync(target)||!statSync(target).isFile()||!target.toLowerCase().endsWith('.apk'))throw Error('Signed APK file not found');
  const sdk=androidBuildTools();
  const badging=sdk?run(sdk.aapt,['dump','badging',target]):run('aapt',['dump','badging',target]);
  // On Windows apksigner is usually a .bat file; invoke the official JAR via
  // Java instead of a shell to avoid path interpolation or injection.
  const signatures=sdk?run('java',['-jar',sdk.signerJar,'verify','--verbose','--print-certs',target]):run('apksigner',['verify','--verbose','--print-certs',target]);
  const result=validateResults(app,badging,signatures);
  console.log(`PASS ${app}: ${result.pkg}; APK v2/v3 signature verified; SHA256 ${result.certFingerprint}`);
  console.log('Requires separate physical-device install, DAL and camera/GPS/notification QA.');
  return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{main();}catch(e){console.error(e.message);process.exitCode=1;}
}
