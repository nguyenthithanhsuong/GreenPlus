import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');

test('Shipper CI gates image publishing on lint, typecheck, build and tests', () => {
  const workflow = read('../../.github/workflows/ci.yml');
  assert.match(workflow, /shipper-ci:\s[\s\S]*?npm run lint -w web-shipper/);
  assert.match(workflow, /shipper-ci:\s[\s\S]*?npm run typecheck -w web-shipper/);
  assert.match(workflow, /shipper-ci:\s[\s\S]*?npm test -w web-shipper/);
  assert.match(workflow, /shipper-ci:\s[\s\S]*?npm run build -w web-shipper/);
  assert.match(workflow, /docker-build:\s[\s\S]*?needs:\s[\s\S]*?- shipper-ci/);
  assert.match(workflow, /Build and load web-shipper image/);
  assert.match(workflow, /Smoke test web-shipper container/);
  assert.match(workflow, /Publish web-shipper image/);
  assert.match(workflow, /api\/auth\/me/);
  assert.match(workflow, /api\/shipper\/deliveries/);
});

test('Shipper Docker image is standalone, non-root and does not bake in credentials', () => {
  const docker = read('../Dockerfile');
  const config = read('../next.config.ts');
  assert.match(config, /output:\s*["']standalone["']/);
  assert.match(config, /outputFileTracingRoot/);
  assert.match(docker, /web-shipper\/\.next\/standalone/);
  assert.match(docker, /CMD \["node", "server\.js"\]/);
  assert.match(docker, /USER greenplus/);
  assert.match(docker, /HEALTHCHECK/);
  assert.doesNotMatch(docker, /^(?:ARG|ENV)\s+(?:SUPABASE_SERVICE_ROLE_KEY|SHIPPER_SESSION_SECRET)\s*=/m);
  assert.doesNotMatch(docker, /COPY --from=builder \/app \.\s*$/m);
});

test('Health endpoint is a no-store public liveness endpoint', () => {
  const health = read('../src/app/api/health/route.ts');
  assert.match(health, /status: "ok"/);
  assert.match(health, /Cache-Control.*no-store/);
  assert.doesNotMatch(health, /shipperDb|SUPABASE_SERVICE_ROLE_KEY/);
});
