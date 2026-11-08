import test from 'node:test';
import assert from 'node:assert/strict';
import {checkMobileRelease, normalizeOrigin, validateManifest, verifyAssetLinks} from '../scripts/lib/mobile-release.mjs';

const origin = 'https://client.greenplus.example';
const sha = 'AB:'.repeat(31) + 'AB';
const manifest = {
  name:'GreenPlus Customer',short_name:'GreenPlus',id:'/',start_url:'/',scope:'/',display:'standalone',
  icons:[{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png'},
    {src:'/icons/icon-512.png',sizes:'512x512',type:'image/png'}],
};
const links = [{relation:['delegate_permission/common.handle_all_urls'],
  target:{namespace:'android_app',package_name:'com.greenplus.client',sha256_cert_fingerprints:[sha]}}];
function fakeResponse(payload, contentType, status = 200, moreHeaders = {}) {
  return {ok:status >= 200 && status < 300,status,
    headers:{get:(key)=>({...{'content-type':contentType},...moreHeaders})[key.toLowerCase()] ?? null},
    text:async ()=>typeof payload === 'string' ? payload : JSON.stringify(payload),
    json:async ()=>payload,
  };
}
function fixture(overrides = {}) {
  return async (url) => {
    const path = new URL(url).pathname;
    return overrides[path] ?? ({
      '/': fakeResponse('<link rel="manifest" href="/manifest.webmanifest">','text/html'),
      '/manifest.webmanifest': fakeResponse(manifest,'application/manifest+json'),
      '/icons/icon-192.png': fakeResponse('PNG','image/png'),
      '/icons/icon-512.png': fakeResponse('PNG','image/png'),
      '/sw.js': fakeResponse('self.addEventListener("fetch",()=>{})','application/javascript',200,{'cache-control':'no-store'}),
      '/offline.html': fakeResponse('<h1>Offline</h1>','text/html'),
      '/.well-known/assetlinks.json': fakeResponse(links,'application/json'),
    }[path] ?? fakeResponse('', 'text/html', 404));
  };
}
test('strict production HTTPS origin, no embedded credentials/path/ports',()=>{
  assert.equal(normalizeOrigin(origin),origin);
  for (const bad of ['http://greenplus.example','https://u:p@greenplus.example',
    'https://greenplus.example/path','https://greenplus.example:8443',
    'https://greenplus.example?x=1']) assert.throws(()=>normalizeOrigin(bad));
});
test('manifest validates scope, icons and same-origin URLs',()=>{
  assert.equal(validateManifest(manifest,origin).length,2);
  assert.throws(()=>validateManifest({...manifest,display:'browser'},origin));
  assert.throws(()=>validateManifest({...manifest,start_url:'https://attacker.example'},origin));
  assert.throws(()=>validateManifest({...manifest,icons:[]},origin));
});
test('Digital Asset Links verify matching package and certificate, not merely a 200 response',()=>{
  verifyAssetLinks(links,'com.greenplus.client');
  assert.throws(()=>verifyAssetLinks(links,'com.greenplus.shipper'));
  assert.throws(()=>verifyAssetLinks([{...links[0],target:{...links[0].target,sha256_cert_fingerprints:['INVALID']}}],'com.greenplus.client'));
});
test('PWA release preflight passes valid manifest, icons, service worker, offline shell',async()=>{
  const result=await checkMobileRelease(origin,{app:'client',fetchImpl:fixture()});
  assert.equal(result.origin,origin);
});
test('TWA release preflight requires assetlinks with correct app ID',async()=>{
  const result=await checkMobileRelease(origin,{app:'client',twa:true,fetchImpl:fixture()});
  assert.equal(result.packageName,'com.greenplus.client');
  await assert.rejects(()=>checkMobileRelease(origin,{app:'shipper',twa:true,fetchImpl:fixture()}));
});
test('rejects redirect to login, missing PNG and service worker cached by CDN',async()=>{
  for (const [path,response] of [
    ['/',fakeResponse('', 'text/html',302)],
    ['/icons/icon-512.png',fakeResponse('html','text/html')],
    ['/sw.js',fakeResponse('self.addEventListener("fetch")','application/javascript')],
  ]) {
    await assert.rejects(()=>checkMobileRelease(origin,{app:'client',fetchImpl:fixture({[path]:response})}));
  }
});
