import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { summarizeAudit, renderAuditSummary } from '../scripts/ci/dependency-audit.mjs';
import { validateDependencyVersions } from '../scripts/ci/dependency-version-gate.mjs';
import { classifyRemoteGatewayError, runGatewayProbe } from '../scripts/ci/check-docker-tenants.mjs';

const root=resolve(import.meta.dirname,'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const auditResult=counts=>({status:1,stdout:JSON.stringify({metadata:{vulnerabilities:counts}})});

test('confirmed high/critical dependency vulnerabilities block publishing',()=>{
  const result=summarizeAudit(auditResult({info:0,low:0,moderate:10,high:2,critical:1}));
  assert.equal(result.status,'blocked');
  assert.equal(result.counts.critical,1);
});

test('moderate dependency findings remain visible but do not fail CI',()=>{
  const result=summarizeAudit(auditResult({info:0,low:0,moderate:5,high:0,critical:0}));
  assert.equal(result.status,'pass');
  assert.equal(result.code,'MODERATE_ADVISORIES');
  assert.match(renderAuditSummary(result),/Moderate: 5/);
});

test('npm registry outage is WARNING, never fabricated PASS',()=>{
  const report=summarizeAudit({status:1,stdout:'npm ERR! registry connection timeout'});
  assert.equal(report.status,'warning');
  assert.equal(report.counts,null);
});

test('remote gateway downtime is advisory but a confirmed data leak blocks',async()=>{
  const outage=classifyRemoteGatewayError(new Error('Connection refused'));
  const leak=classifyRemoteGatewayError(new Error('CROSS-TENANT DATA LEAK in orders for enterprise'));
  assert.equal(outage.status,'warning');
  assert.equal(leak.status,'blocked');
  const report=await runGatewayProbe({advisory:true,verify:()=>{throw Error('Connection refused')},output:'artifacts/ci/test-gateway-downtime.json'});
  assert.equal(report.ok,true);
  assert.equal(report.report.status,'warning');
  const failed=await runGatewayProbe({advisory:true,verify:()=>{throw Error('CROSS-TENANT DATA LEAK in orders for enterprise')},output:'artifacts/ci/test-gateway-breach.json'});
  assert.equal(failed.ok,false);
});

test('offline security gate catches stale Next lock even when a provider is unavailable',()=>{
 const v='16.4.6';
 const workspace={dependencies:{next:v},devDependencies:{'eslint-config-next':v}};
 const setup={root:{overrides:{next:v}},workspaces:{admin:workspace,client:workspace,shipper:workspace},lock:{packages:{
  'node_modules/next':{version:v},'node_modules/eslint-config-next':{version:v},
  'web-admin':workspace,'web-client':workspace,'web-shipper':workspace,
 }}};
 assert.equal(validateDependencyVersions(setup).ok,true);
 setup.lock.packages['node_modules/next'].version='16.3.8';
 assert.equal(validateDependencyVersions(setup).ok,false);
 setup.lock.packages['node_modules/next'].version=v;
 setup.workspaces.shipper.dependencies.next='16.4.5';
 assert.equal(validateDependencyVersions(setup).ok,false);
});

test('CI keeps seven required gates and advisory remote health while enforcing dependency audit',()=>{
  const ci=read('.github/workflows/ci.yml');
  assert.match(ci,/run: node scripts\/ci\/dependency-audit\.mjs/);
  assert.match(ci,/run: node scripts\/ci\/dependency-version-gate\.mjs/);
  assert.match(ci,/run: node scripts\/ci\/check-docker-tenants\.mjs --advisory/);
  assert.match(ci,/needs: \[pipeline-contracts, frontend-ci, backend-ci, ai-service-ci, docker-db-ci, supabase-db-ci, external-services-ci\]/);
  assert.doesNotMatch(ci,/continue-on-error: true/);
  const cli=read('scripts/local/final-greenplus-check.ps1');
  for(const command of ['security:next:apply','ci:quality-report','dependency-audit.mjs','npm.cmd','run\x27,\x27build']){
    assert.ok(cli.includes(command),`Missing one-shot gate: ${command}`);
  }
  assert.doesNotMatch(cli.split('\n').filter(line=>!line.trim().startsWith('#')).join('\n'),/docker system prune|db push|db reset|--force(?:\s|\x27)/i);
});

test('promotions cancel superseded network requests and avoid untrusted remote-image optimization',()=>{
 const client=read('web-client/frontend/ai/ActivePromotions.tsx');
 assert.match(client,/requestRef\.current\?\.abort\(\)/);
 assert.match(client,/signal: controller\.signal/);
 assert.match(client,/controller\.signal\.aborted/);
 assert.match(client,/<Image unoptimized width=\{96\} height=\{96\}/);
});
