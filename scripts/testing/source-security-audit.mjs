#!/usr/bin/env node
/** Static secret/log signal audit; no source content or sensitive values in output. */
import {readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const roots=['web-admin/backend','web-admin/src','web-admin/frontend','web-client/backend','web-client/src','web-client/frontend','web-shipper/src','packages'];
const extensions=new Set(['.ts','.tsx','.js','.mjs','.mts']);
const ignore=new Set(['node_modules','.next','.git','dist','coverage','out','tests','test','public']);
const fatalRules=[
 ['public-secret-env',/NEXT_PUBLIC_(?:SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|AI_LLM_KEY|GREENPLUS_AI_SERVICE_KEY|AUTH_HANDOFF_SECRET|SENTRY_AUTH_TOKEN|BETTER_STACK_SOURCE_TOKEN)/],
 ['embedded-private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
 ['unsafe-dynamic-execution',/\b(?:eval|new Function)\s*\(/],
];
const advisoryRules=[
 ['console-log',/\bconsole\.(?:debug|log|info)\s*\(/],
 ['auth-identifier-in-log',/\blogger\.(?:info|warn|error|debug)\([^\n]*\b(?:email|phone|password|token)\b/i],
 ['browser-sensitive-storage',/\blocalStorage\.setItem\s*\([^\n]*(?:token|password|secret)/i]
];
export function auditSource(root=process.cwd()){
 const checks=[];
 function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){
  if(ignore.has(item.name))continue;
  const full=resolve(dir,item.name);
  if(item.isDirectory())walk(full);else if(item.isFile()&&extensions.has(extname(item.name))){
   const path=relative(root,full).replaceAll('\\','/');const lines=readFileSync(full,'utf8').split(/\r?\n/);
   lines.forEach((line,i)=>{
    for(const [rule,regex] of fatalRules)if(regex.test(line))checks.push({path,line:i+1,rule,severity:'critical'});
    for(const [rule,regex] of advisoryRules)if(regex.test(line))checks.push({path,line:i+1,rule,severity:'advisory'});
   });
  }
 }}
 for(const dir of roots)walk(resolve(root,dir));
 return {schemaVersion:1,files:roots,critical:checks.filter(x=>x.severity==='critical').length,advisory:checks.filter(x=>x.severity==='advisory').length,findings:checks};
}
export function saveAudit(report,path='artifacts/testing/source-security-audit.json'){
 const target=resolve(path);mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,JSON.stringify(report,null,2)+'\n');return target;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const report=auditSource();const target=saveAudit(report);
 console.log(`Source security audit: ${report.critical} critical, ${report.advisory} advisory. Report: ${target}`);
 if(report.critical)process.exitCode=1;
}
