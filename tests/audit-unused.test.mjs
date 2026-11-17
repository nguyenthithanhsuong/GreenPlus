import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { scanRepository } from '../scripts/audit-unused.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'greenplus-audit-'));
  t.after(async () => rm(root, { force: true, recursive: true }));
  const put = async (path, data) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), data);
  };
  await put('package.json', JSON.stringify({ scripts: { web: 'turbo dev', 'audit:unused': 'node scripts/audit-unused.mjs' } }));
  return { root, put };
}

test('read-only scan never deletes an isolated module and flags it for review only', async t => {
  const { root, put } = await fixture(t);
  const path = 'web-admin/backend/obsolete.ts';
  const bytes = 'export const previousWorkflow = true;\n';
  await put(path, bytes);
  const report = await scanRepository(root);
  assert.equal(report.candidates.find(item => item.path === path)?.decision, 'REVIEW_ONLY');
  assert.equal(await readFile(join(root, path), 'utf8'), bytes);
});

test('Next route conventions and SQL migration are protected even without source imports', async t => {
  const { root, put } = await fixture(t);
  await put('web-admin/src/app/settings/page.tsx', 'export default function Page(){ return null; }');
  await put('web-admin/src/app/api/health/route.ts', 'export const GET=()=>Response.json({ok:true});');
  await put('supabase/migrations/0001_baseline.sql', '-- seed schema');
  await put('web-admin/frontend/settings/Linked.tsx', 'export default function Linked(){return null;}');
  await put('web-admin/src/app/settings/layout.tsx', "import Linked from '../../../frontend/settings/Linked'; export default Linked;");
  const report = await scanRepository(root);
  assert.equal(report.counts.routes, 2);
  assert.equal(report.protected.migrationFiles, 1);
  assert.ok(!report.candidates.some(item => item.path.endsWith('Linked.tsx') || item.path.endsWith('page.tsx')));
});

test('scanner finds route collisions and invalid npm commands but does not fail or mutate by default', async t => {
  const { root, put } = await fixture(t);
  await put('web-client/src/app/(shop)/cart/page.tsx', 'export default function Page() {return null;}');
  await put('web-client/src/app/cart/page.tsx', 'export default function Page() {return null;}');
  await put('README.md', 'Do not use `npm run old-command`; use `npm run web` instead.');
  const report = await scanRepository(root);
  assert.equal(report.routeCollisions.length, 1);
  assert.equal(report.staleNpmCommands[0].command, 'old-command');
  assert.equal(await readFile(join(root, 'README.md'), 'utf8'), 'Do not use `npm run old-command`; use `npm run web` instead.');
});

test('workspace npm scripts are not mistaken for missing root scripts', async t => {
  const { root, put } = await fixture(t);
  await put('web-shipper/package.json', JSON.stringify({ scripts: { 'test:e2e': 'playwright test' } }));
  await put('.github/workflows/ci.yml', 'run: npm run test:e2e -w web-shipper\n');
  const report = await scanRepository(root);
  assert.deepEqual(report.staleNpmCommands, []);
});
