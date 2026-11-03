import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=file=>readFileSync(new URL(file, import.meta.url),'utf8');
test('Shipper matrix is independent, its tests run, all gates block Docker publishing',()=>{
 const workflow=read('../../.github/workflows/ci.yml');
 assert.match(workflow,/frontend-ci:/);
 assert.match(workflow,/- \{ app: shipper, node: '22' \}/);
 assert.match(workflow,/npm run lint -w web-\$\{\{ matrix\.app \}\}/);
 assert.match(workflow,/npm run typecheck -w web-\$\{\{ matrix\.app \}\}/);
 assert.match(workflow,/npm test -w web-shipper/);
 assert.match(workflow,/npm run test:e2e -w web-shipper/);
 assert.match(workflow,/npm run build -w web-\$\{\{ matrix\.app \}\}/);
 assert.match(workflow,/needs: \[pipeline-contracts, frontend-ci, backend-ci, docker-db-ci, supabase-db-ci, external-services-ci\]/);
 assert.match(workflow,/Smoke all three images before any publish/);
 assert.match(read('../../scripts/ci/smoke-images.sh'),/api\/auth\/me/);
 assert.match(read('../../scripts/ci/smoke-images.sh'),/api\/shipper\/deliveries/);
});
test('Shipper Docker is non-root and does not embed secrets',()=>{
 const docker=read('../Dockerfile'), config=read('../next.config.ts');
 assert.match(config,/output:\s*["']standalone["']/);
 assert.match(config,/outputFileTracingRoot/);
 assert.match(docker,/web-shipper\/\.next\/standalone/);
 assert.match(docker,/CMD \["node", "server\.js"\]/);
 assert.match(docker,/USER greenplus/);
 assert.match(docker,/HEALTHCHECK/);
 assert.doesNotMatch(docker,/^(?:ARG|ENV)\s+(?:SUPABASE_SERVICE_ROLE_KEY|SHIPPER_SESSION_SECRET)\s*=/m);
});
test('Shipper health stays unauthenticated and does not access DB',()=>{
 const route=read('../src/app/api/health/route.ts');
 assert.match(route,/status: "ok"/);
 assert.match(route,/Cache-Control.*no-store/);
 assert.doesNotMatch(route,/shipperDb|SUPABASE_SERVICE_ROLE_KEY/);
});
