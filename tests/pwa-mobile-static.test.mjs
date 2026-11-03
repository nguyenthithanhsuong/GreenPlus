import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
for(const app of ['web-client','web-shipper']){
 test(`${app} has PWA manifest, SW, icons, offline and TWA assetlinks`,()=>{
  for(const path of ['src/app/manifest.ts','src/app/PwaRegister.tsx','src/app/.well-known/assetlinks.json/route.ts','public/sw.js','public/offline.html','public/icons/icon-192.png','public/icons/icon-512.png','public/icons/icon-512-maskable.png'])
   assert.ok(existsSync(resolve(root,app,path)),path);
  const sw=readFileSync(resolve(root,app,'public/sw.js'),'utf8');
  assert.match(sw,/req\.mode!=='navigate'/);
  assert.match(sw,/\/api\//);
  assert.doesNotMatch(sw,/cache\.put\(req|cache\.add\(req/);
 });
}
