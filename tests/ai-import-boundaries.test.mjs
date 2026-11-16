import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const targets=[
 'web-admin/backend/modules/ai-assist', 'web-admin/frontend/ai',
 'web-admin/src/app/api/ai','web-admin/src/app/api/support',
 'web-client/backend/modules/ai-assist','web-client/frontend/ai',
 'web-client/src/app/api/ai','web-client/src/app/api/support',
 'web-client/src/app/api/promotions',
 'web-shipper/src/frontend/ai','web-shipper/src/server/ai-actor.ts',
 'web-shipper/src/app/api/ai','web-shipper/src/app/api/support',
];
function scan(location){
 const full=resolve(root,location);
 if(!existsSync(full))return[];
 const entries=[];
 function walk(p){
  for(const d of readdirSync(p,{withFileTypes:true})){
   const next=join(p,d.name);
   if(d.isDirectory())walk(next);
   else if(/\.(ts|tsx|mts)$/.test(next))entries.push(next);
  }
 }
 if(/\.(ts|tsx|mts)$/.test(full))return[full];
 walk(full);return entries;
}
function importFileExists(from,specifier){
 const absolute=resolve(dirname(from),specifier);
 return [absolute,absolute+'.ts',absolute+'.tsx',absolute+'.mts',absolute+'.mjs',absolute+'.js',absolute+'.json',
   join(absolute,'index.ts'),join(absolute,'index.tsx'),join(absolute,'index.mjs')]
   .some(existsSync);
}
test('every relative AI and support import resolves within project source',()=>{
 const errors=[];
 for(const target of targets){
  for(const file of scan(target)){
   const code=readFileSync(file,'utf8');
   for(const hit of code.matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g)){
    if(!importFileExists(file,hit[1]))errors.push(`${relative(root,file)} -> ${hit[1]}`);
   }
  }
 }
 assert.deepEqual(errors,[]);
});
