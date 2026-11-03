import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('Shipper E2E runs against a built Next.js production server', () => {
  const ci = read('.github/workflows/ci.yml');
  const shipper = read('web-shipper/playwright.config.ts');
  const build = ci.indexOf('      - name: Build\n        run: npm run build -w web-${{ matrix.app }}');
  const e2e = ci.indexOf('      - name: Shipper browser E2E tests');
  assert.ok(build > 0 && e2e > build, 'build must precede browser tests');
  assert.match(shipper, /process\.env\.CI \? "npm run start" : "npm run dev"/);
  assert.match(shipper, /url: "http:\/\/127\.0\.0\.1:3002\/login"/);
  assert.match(shipper, /trace: "retain-on-failure"/);
  assert.match(ci, /actions\/upload-artifact@v4/);
  assert.match(ci, /if: failure\(\) && matrix\.app == 'shipper'/);
});

test('E2E waits for observable React interaction without skipping login validation', () => {
  const spec = read('web-shipper/e2e/shipper.spec.ts');
  assert.match(spec, /\.toPass\(\{ timeout: 20000/);
  assert.match(spec, /getByRole\("button", \{ name: "Ẩn mật khẩu" \}\)/);
  assert.match(spec, /page\.route\("\*\*\/api\/auth\/sign-in"/);
  assert.match(spec, /expect\(\(await signInResponse\)\.status\(\)\)\.toBe\(401\)/);
  assert.match(spec, /getByRole\("alert"\)\)\.toContainText/);
  assert.match(spec, /request\.get\("\/api\/shipper\/deliveries"\)/);
});

test('CI job display names are concise and Docker depends on all gates', () => {
  const ci = read('.github/workflows/ci.yml');
  for (const name of ['CI Rules','Admin CI','Client CI','Shipper CI','Backend CI','Docker DB CI','Supabase DB CI','Services CI','Docker Build']) {
    assert.ok(ci.includes(name), `missing consistent job name: ${name}`);
  }
  assert.match(ci, /needs: \[pipeline-contracts, frontend-ci, backend-ci, docker-db-ci, supabase-db-ci, external-services-ci\]/);
  assert.doesNotMatch(ci, /^    name: .*\(.*\)/m);
  assert.match(read('.github/workflows/deploy-prod.yml'), /name: Production Verify/);
  assert.match(read('.github/workflows/deploy-staging.yml'), /name: Staging Verify/);
});
