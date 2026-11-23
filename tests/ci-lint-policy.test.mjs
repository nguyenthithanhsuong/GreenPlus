import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
test('preexisting React Compiler warnings are visible in all three apps; other lint errors still block',()=>{
  for(const app of ['admin','client','shipper']){
    const source=read(`web-${app}/eslint.config.mjs`);
    for(const name of ['set-state-in-effect','refs','preserve-manual-memoization']){
      assert.match(source,new RegExp(`"react-hooks/${name}": "warn"`));
      assert.doesNotMatch(source,new RegExp(`"react-hooks/${name}": "off"`));
    }
  }
  const ci=read('.github/workflows/ci.yml');
  assert.match(ci,/run: npm run lint -w web-\$\{\{ matrix\.app \}\}/);
  assert.doesNotMatch(ci,/continue-on-error:\s*true/);
  assert.match(ci,/run: npm run typecheck -w web-\$\{\{ matrix\.app \}\}/);
  assert.match(ci,/run: npm run build -w web-\$\{\{ matrix\.app \}\}/);
});
test('storage signed-upload timestamp is generated on file selection, not impure render',()=>{
  const s=read('web-admin/src/app/backend/storage/page.tsx');
  assert.match(s,/setFileSelectedAt\(Date\.now\(\)\)/);
  assert.match(s,/timestamp = fileSelectedAt/);
  assert.doesNotMatch(s,/const timestamp = Date\.now\(\);/);
});
