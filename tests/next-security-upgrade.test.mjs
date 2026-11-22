import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { TARGET, manifests, makePlan, applyUpgrade } from '../scripts/ci/upgrade-next-security.mjs';

const makeFixture = (version = '16.3.8') => {
  const root = mkdtempSync(join(tmpdir(), 'greenplus-next-upgrade-'));
  const originals = {};
  const write = (file, value) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    const body = JSON.stringify(value, null, 2) + '\n';
    originals[file] = body;
    writeFileSync(join(root, file), body);
  };
  write('package.json', { overrides: { next: version }});
  for (const app of ['admin','client','shipper']) write(`web-${app}/package.json`, {dependencies:{next:version},devDependencies:{'eslint-config-next':version}});
  write('package-lock.json', {packages:{'node_modules/next':{version},'node_modules/eslint-config-next':{version},...Object.fromEntries(['admin','client','shipper'].map(app=>[`web-${app}`,{dependencies:{next:version},devDependencies:{'eslint-config-next':version}}]))}});
  return {root, originals, close:()=>rmSync(root,{force:true,recursive:true})};
};

test('security-upgrade dry-run updates every workspace and override, without changing files', () => {
  const fixture=makeFixture();
  try {
    const plan=makePlan(Object.fromEntries(manifests.map(f=>[f,readFileSync(join(fixture.root,f),'utf8')])));
    assert.equal(plan.changes.length, 7);
    assert.equal(JSON.parse(plan.updated['package.json']).overrides.next,TARGET);
    for(const f of manifests)assert.equal(readFileSync(join(fixture.root,f),'utf8'),fixture.originals[f]);
  } finally {fixture.close();}
});

test('security-upgrade refuses to downgrade an unknown newer patch', () => {
  const fixture=makeFixture('16.4.7');
  try {assert.throws(()=>applyUpgrade({root:fixture.root}),/downgrade/);} finally {fixture.close();}
});

test('security-upgrade rolls back exact manifests and lockfile when registry/lockfile update fails', () => {
  const fixture=makeFixture();
  try {
    assert.throws(()=>applyUpgrade({root:fixture.root,runner:()=>({status:1})}),/lockfile refresh failed/);
    for(const [file,body] of Object.entries(fixture.originals))assert.equal(readFileSync(join(fixture.root,file),'utf8'),body);
  } finally {fixture.close();}
});

test('security-upgrade checks refreshed lockfile and restores on a mismatched npm result', () => {
  const fixture=makeFixture();
  try {
    assert.throws(()=>applyUpgrade({root:fixture.root,runner:()=>({status:0})}),/does not pin/);
    for(const [file,body] of Object.entries(fixture.originals))assert.equal(readFileSync(join(fixture.root,file),'utf8'),body);
  } finally {fixture.close();}
});

test('security-upgrade succeeds only after npm generates matching dependency versions', () => {
  const fixture=makeFixture();
  try {
    const result=applyUpgrade({root:fixture.root,runner:()=>{
      const f=join(fixture.root,'package-lock.json');const lock=JSON.parse(readFileSync(f,'utf8'));
      lock.packages['node_modules/next'].version=TARGET;
      lock.packages['node_modules/eslint-config-next'].version=TARGET;
      for(const app of ['admin','client','shipper']){
        lock.packages[`web-${app}`].dependencies.next=TARGET;
        lock.packages[`web-${app}`].devDependencies['eslint-config-next']=TARGET;
      }
      writeFileSync(f,JSON.stringify(lock,null,2)+'\n');return {status:0};
    }});
    assert.equal(result.changes.length,7);
    assert.equal(JSON.parse(readFileSync(join(fixture.root,'package.json'),'utf8')).overrides.next,TARGET);
    assert.equal(applyUpgrade({root:fixture.root}).changes.length,0);
  } finally {fixture.close();}
});

test('security-upgrade rejects a stale lockfile even when all manifests already match',()=>{
 const fixture=makeFixture(TARGET);
 try{
  const file=join(fixture.root,'package-lock.json');
  const lock=JSON.parse(readFileSync(file,'utf8'));
  lock.packages['node_modules/next'].version='16.3.8';
  writeFileSync(file,JSON.stringify(lock));
  assert.throws(()=>applyUpgrade({root:fixture.root}),/package-lock\.json is stale/);
 } finally {fixture.close();}
});
