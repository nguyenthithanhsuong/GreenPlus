import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
test('minimal root command aliases stay consistent with dev runner',()=>{
 const scripts=JSON.parse(read('package.json')).scripts;
 assert.equal(scripts.web,'turbo dev --ui=tui');
 assert.equal(scripts.dev,'node scripts/dev-with-docker.mjs');
 assert.equal(scripts['dev:all'],undefined);
 assert.ok(!('dev:apps' in scripts));
 assert.ok(!('dev:web' in scripts));
 assert.match(read('scripts/dev-with-docker.mjs'),/spawn\('npm run web'/);
});
test('AI support payload spread accepts only object-shaped arguments',()=>{
 assert.match(read('web-client/frontend/ai/CustomerSupport.tsx'),/body:Record<string, unknown>/);
});
test('AI insight queries retain individual result types',()=>{
 const src=read('web-admin/backend/modules/ai-assist/insights.ts');
 for(const name of ['forecast','alerts','suggestions','triage','knowledge']) assert.match(src,new RegExp(`resultOrFail\\(${name}\\.data, ${name}\\.error\\)`));
 assert.doesNotMatch(src,/\.map\(\(item\)=>resultOrFail/);
});
test('PageGuard handles nullable portal roles without removing auth checks',()=>{
 const src=read('web-admin/frontend/shared/PageGuard.tsx');
 assert.match(src,/asPortalRole\(/);
 assert.match(src,/result\.userId !== userId \|\| result\.role !== role/);
 assert.match(src,/verifySession\(identity\)/);
 assert.match(src,/middleware/i);
});
test('CI shell health poll uses a counted attempt that ShellCheck can follow',()=>{
 const src=read('.github/workflows/ci.yml');
 assert.match(src,/for \(\(attempt = 1; attempt <= 30; attempt\+\+\)\); do/);
 assert.doesNotMatch(src,/for i in \$\(seq 1 30\)/);
});
