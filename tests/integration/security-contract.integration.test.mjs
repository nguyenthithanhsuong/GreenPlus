import test from 'node:test';import assert from 'node:assert/strict';
import {auditSource} from '../../scripts/testing/source-security-audit.mjs';
test('critical exposure patterns are absent from runtime code and route handlers',()=>{
 const report=auditSource();
 assert.equal(report.critical,0,JSON.stringify(report.findings.filter(x=>x.severity==='critical')));
 assert.ok(report.advisory>=0);
 assert.ok(!JSON.stringify(report).includes('-----BEGIN PRIVATE KEY-----'));
});
