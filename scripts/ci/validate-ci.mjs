import { readFileSync,existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const requiredFiles=[
  'scripts/ci/check-external.mjs','scripts/ci/check-vercel-deployments.mjs','scripts/ci/smoke-images.sh','tests/ci-pipeline.test.mjs',
  'scripts/test-three-tier-transactions.mjs','scripts/test-three-tier-lifecycle.mjs',
  'scripts/repair-three-tier-commerce.mjs','scripts/three-tier-docker.mjs',
  'docker/three-tier/sql/shared/003_inventory_orders.sql',
  'docker/three-tier/sql/shared/004_payment_delivery_simulation.sql',
  'docker/three-tier/sql/enterprise-a/003_inventory_orders.sql',
  'docker/three-tier/sql/enterprise-a/004_payment_delivery_simulation.sql',
  'docker/three-tier/sql/enterprise-b/003_inventory_orders.sql',
  'docker/three-tier/sql/enterprise-b/004_payment_delivery_simulation.sql',
  'supabase/tests/database/001_rls.test.sql',
];
for(const file of requiredFiles){if(!existsSync(resolve(root,file)))throw Error(`Required CI file missing: ${file}. Commit earlier Phase patches too.`);}
const ci=read('.github/workflows/ci.yml');
const checks=['pipeline-contracts:','frontend-ci:','backend-ci:','docker-db-ci:','supabase-db-ci:','external-services-ci:','docker-build:'];
for(const check of checks)if(!ci.includes(check))throw Error(`Missing CI gate ${check}`);
for(const job of checks.slice(0,-1))if(!ci.includes(job.replace(/:$/,'')))throw Error(`Docker build depends on missing job: ${job}`);
if(!ci.includes('needs: [pipeline-contracts, frontend-ci, backend-ci, docker-db-ci, supabase-db-ci, external-services-ci]'))throw Error('Docker build needs all six gates');
if(!ci.includes("github.ref == 'refs/heads/main'"))throw Error('Image publication must be main-only');
if(!ci.includes('secrets.NEXT_PUBLIC_SUPABASE_URL'))throw Error('Main image needs real public Supabase URL, not the CI placeholder');
if(ci.includes('continue-on-error: true'))throw Error('Do not downgrade required gates to nonblocking');
for(const app of ['web-admin','web-client']){
 const df=read(`${app}/Dockerfile`);
 for(const secret of ['SUPABASE_SERVICE_ROLE_KEY','SENTRY_AUTH_TOKEN','BETTER_STACK_SOURCE_TOKEN']){
  const forbidden=new RegExp(`^(?:ARG|ENV)\\s+${secret}(?:\\s|=)`, 'm');
  if(forbidden.test(df))throw Error(`${app} Dockerfile embeds ${secret} via build args or ENV`);
 }
}
for(const name of ['deploy-prod.yml','deploy-staging.yml']){
 const y=read(`.github/workflows/${name}`);
 if(/on:\s*\n\s*push:/m.test(y))throw Error(`Unsafe independent deploy trigger in ${name}`);
 if(/Deploying to (?:production|staging)\.\.\./.test(y))throw Error(`Fake deployment success in ${name}`);
}
console.log('PASS: six required gates, secret-free Dockerfiles and no independent push deploys.');
