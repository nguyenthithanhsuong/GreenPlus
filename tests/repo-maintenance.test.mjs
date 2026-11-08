import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile, access, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { planCleanup, quarantineFiles, restoreBatch, maintenanceCommandSpec } from '../scripts/repo-maintenance.mjs';

// fs/promises returns platform-native absolute paths (\\ on Windows, / on POSIX).
// Always normalize injected path comparisons, or the fault injection silently
// stops exercising the code branch that a test claims to verify.
const portablePath = path => path.replaceAll('\\', '/');

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'greenplus-maintenance-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const put = async (path, content) => {
    const destination = join(root, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  };
  const candidate = (path, content) => ({
    path, sha256: createHash('sha256').update(content).digest('hex'),
  });
  return { root, put, candidate };
}

test('audit finds an approved unused file without modifying source', async t => {
  const f = await fixture(t);
  const path = 'web-admin/backend/unused/dead.ts';
  await f.put(path, 'export const dead = true;\n');
  const plan = await planCleanup(f.root, [f.candidate(path, 'export const dead = true;\n')]);
  assert.equal(plan[0].decision, 'eligible');
  assert.equal(await readFile(join(f.root, path), 'utf8'), 'export const dead = true;\n');
});

test('changed source hash is preserved even when it has no import', async t => {
  const f = await fixture(t);
  const path = 'web-admin/backend/unused/dead.ts';
  await f.put(path, 'export const dead = 2;\n');
  const plan = await planCleanup(f.root, [f.candidate(path, 'export const dead = 1;\n')]);
  assert.equal(plan[0].decision, 'skip');
  assert.match(plan[0].reasons.join(' '), /Checksum/);
});

test('relative imports from active Next entrypoints protect referenced files', async t => {
  const f = await fixture(t);
  const path = 'web-admin/backend/legacy.ts';
  const data = 'export const legacy = true;';
  await f.put(path, data);
  await f.put('web-admin/src/app/page.ts', `import { legacy } from '../../backend/legacy';\n`);
  const plan = await planCleanup(f.root, [f.candidate(path, data)]);
  assert.equal(plan[0].decision, 'skip');
  assert.match(plan[0].reasons.join(' '), /Module import/);
});

test('test harness path references block deleting a legacy component', async t => {
  const f = await fixture(t);
  const path = 'web-client/frontend/payment/components/OldPayment.tsx';
  await f.put(path, 'export default function OldPayment() { return null }');
  await f.put('web-client/tests/legacy.test.mjs', `readFileSync('frontend/payment/components/OldPayment.tsx')`);
  const plan = await planCleanup(f.root, [f.candidate(path, 'export default function OldPayment() { return null }')]);
  assert.equal(plan[0].decision, 'skip');
  assert.match(plan[0].reasons.join(' '), /Explicit path reference/);
});

test('interdependent candidates are removed only when the entire group is eligible', async t => {
  const f = await fixture(t);
  const a = 'web-admin/backend/old/a.ts';
  const b = 'web-admin/backend/old/b.ts';
  const contentA = `export const a = 1;`;
  const contentB = `import { a } from './a';\nexport const b = a;`;
  await f.put(a, contentA);
  await f.put(b, contentB);
  const list = [f.candidate(a, contentA), f.candidate(b, contentB)];
  assert.deepEqual((await planCleanup(f.root, list)).map(x=>x.decision), ['eligible','eligible']);
  await f.put(b, `import { a } from './a';\nexport const b = a + 1;`);
  assert.deepEqual((await planCleanup(f.root, list)).map(x=>x.decision), ['skip','skip']);
});

test('apply quarantines original files and prunes empty folder; restore is lossless', async t => {
  const f = await fixture(t);
  const path = 'web-admin/backend/unused/legacy.ts';
  const content = `export const legacy = 'hello';`;
  await f.put(path, content);
  const batch = await quarantineFiles(f.root, [f.candidate(path, content)], {apply: true});
  assert.match(batch, /^batch-/);
  await assert.rejects(access(join(f.root, path)));
  await assert.rejects(access(join(f.root, 'web-admin/backend/unused')));
  assert.equal(await restoreBatch(f.root, batch), 1);
  assert.equal(await readFile(join(f.root, path), 'utf8'), content);
});

test('read-only CI gate and Client workspace tests are wired into root and Actions', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(pkg.scripts['test:release:static'], /npm run test:client/);
  assert.match(pkg.scripts['check-all'], /^npm run check:ci$/);
  assert.doesNotMatch(pkg.scripts['check:ci'], /lint-fix|prettier --write/);
  assert.match(ci, /Client checkout and multi-tenant tests/);
  assert.match(ci, /matrix\.app == 'client'/);
  assert.match(ci, /app: client, node: '22'/);
});

test('fault injection matches real paths on Windows and POSIX', () => {
  assert.ok(portablePath('C:\\Users\\me\\GreenPlus\\mobile\\customer_app').endsWith('/mobile/customer_app'));
  assert.ok(portablePath('/home/me/GreenPlus/web-admin/backend/unused/b.ts').endsWith('/unused/b.ts'));
  assert.ok(portablePath('F:\\GreenPlus\\web-admin\\backend\\unused\\b.ts').endsWith('/unused/b.ts'));
});

test('maintenance invokes npm scripts on Windows without shell=true or unsafe interpolated args', () => {
  assert.deepEqual(maintenanceCommandSpec('npm', ['run', 'lint'], 'win32', 'C:\\Windows\\System32\\cmd.exe'), {
    command: 'C:\\Windows\\System32\\cmd.exe', args: ['/d', '/s', '/c', 'npm run lint'],
  });
  assert.deepEqual(maintenanceCommandSpec('npm', ['run', 'lint'], 'linux'), {
    command: 'npm', args: ['run', 'lint'],
  });
  assert.throws(() => maintenanceCommandSpec('npm', ['run', 'lint & del /q *'], 'win32'), /Unsafe npm invocation/);
});

test('one-shot Sentry cleanup helper is preserved until old configs are absent', async t => {
  const f = await fixture(t);
  const path = ['scripts', 'remove-legacy-sentry-configs.mjs'].join('/');
  const content = '// one-time setup';
  await f.put(path, content);
  await f.put('web-admin/sentry.client.config.ts', 'Sentry.init({})');
  const plan = await planCleanup(f.root, [f.candidate(path, content)]);
  assert.equal(plan[0].decision, 'skip');
  assert.match(plan[0].reasons.join(' '), /Legacy Sentry configs/);
});


test('Windows EBUSY on optional Flutter folder is skipped without losing mandatory cleanup', async t => {
  const f = await fixture(t);
  const oldPath = 'web-admin/backend/unused/legacy.ts';
  const oldContent = 'export const legacy = true;\n';
  const customerPath = 'mobile/customer_app/lib/main.dart';
  const shipperPath = 'mobile/shipper_app/lib/main.dart';
  const customerContent = '// customer Flutter prototype\n';
  const shipperContent = '// shipper Flutter prototype\n';
  await f.put(oldPath, oldContent);
  await f.put(customerPath, customerContent);
  await f.put(shipperPath, shipperContent);
  await f.put('scripts/maintenance/legacy-candidates.json', JSON.stringify({
    candidates: [],
    optionalLegacyFlutter: [
      { path: 'mobile/customer_app', files: [f.candidate(customerPath, customerContent)] },
      { path: 'mobile/shipper_app', files: [f.candidate(shipperPath, shipperContent)] },
    ],
  }));
  const moves = [];
  const batch = await quarantineFiles(f.root, [f.candidate(oldPath, oldContent)], {
    apply: true,
    legacyFlutter: true,
    move: async (from, to) => {
      moves.push(from);
      if (portablePath(from).endsWith('/mobile/customer_app')) {
        const error = new Error('Resource busy on Windows'); error.code = 'EBUSY'; throw error;
      }
      return rename(from, to);
    },
  });
  assert.ok(moves.some(from => portablePath(from).endsWith('/mobile/customer_app')), 'fault injection must observe attempted Flutter move');
  assert.equal(await readFile(join(f.root, customerPath), 'utf8'), customerContent);
  await assert.rejects(access(join(f.root, oldPath)));
  await assert.rejects(access(join(f.root, shipperPath)));
  const meta = JSON.parse(await readFile(join(f.root, `artifacts/maintenance/quarantine/${batch}/manifest.json`), 'utf8'));
  assert.equal(meta.status, 'quarantined');
  assert.deepEqual(meta.skippedFlutter, [{path:'mobile/customer_app', reason:'EBUSY'}]);
  assert.deepEqual(meta.movedDirs, ['mobile/shipper_app']);
  assert.equal(await restoreBatch(f.root, batch), 2);
  assert.equal(await readFile(join(f.root, oldPath), 'utf8'), oldContent);
  assert.equal(await readFile(join(f.root, shipperPath), 'utf8'), shipperContent);
  assert.equal(await readFile(join(f.root, customerPath), 'utf8'), customerContent);
});

test('mandatory source move failure immediately rolls back previously quarantined files', async t => {
  const f = await fixture(t);
  const pathA = 'web-admin/backend/unused/a.ts';
  const pathB = 'web-admin/backend/unused/b.ts';
  await f.put(pathA, 'export const a = 1;');
  await f.put(pathB, 'export const b = 2;');
  const allowlist = [f.candidate(pathA, 'export const a = 1;'), f.candidate(pathB, 'export const b = 2;')];
  let injectedFailure = false;
  await assert.rejects(quarantineFiles(f.root, allowlist, {
    apply: true,
    move: async (from, to) => {
      if (portablePath(from).endsWith('/unused/b.ts')) {
        injectedFailure = true;
        const error = new Error('In use'); error.code = 'EBUSY'; throw error;
      }
      return rename(from, to);
    },
  }), /all quarantined files were restored/);
  assert.equal(injectedFailure, true, 'mandatory source fault injection must have fired');
  assert.equal(await readFile(join(f.root, pathA), 'utf8'), 'export const a = 1;');
  assert.equal(await readFile(join(f.root, pathB), 'utf8'), 'export const b = 2;');
  const base = join(f.root, 'artifacts/maintenance/quarantine');
  const { readdir } = await import('node:fs/promises');
  const [name] = await readdir(base);
  const meta = JSON.parse(await readFile(join(base, name, 'manifest.json'), 'utf8'));
  assert.equal(meta.status, 'restored');
});

test('restore understands a move journaled before file was moved but not committed to manifest', async t => {
  const f = await fixture(t);
  const path = 'web-admin/backend/unused/crash.ts';
  const content = 'export const moved = true;';
  await f.put(path, content);
  const batch = 'batch-2026-11-08T04-29-20-256Z-12345';
  const dir = join(f.root, 'artifacts/maintenance/quarantine', batch);
  await mkdir(dirname(join(dir, path)), { recursive: true });
  await rename(join(f.root, path), join(dir, path));
  await writeFile(join(dir, 'manifest.json'), JSON.stringify({
    name:batch, version:2, status:'applying', moved:[], movedDirs:[],
    pendingMove:{path,kind:'file'},
  }));
  assert.equal(await restoreBatch(f.root, batch), 1);
  assert.equal(await readFile(join(f.root, path), 'utf8'), content);
  const meta = JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
  assert.equal(meta.status,'restored');
  assert.equal(meta.pendingMove, null);
});

test('new cleanup refuses to start while an interrupted journal is unresolved', async t => {
  const f = await fixture(t);
  const path = 'web-admin/backend/unused/unused.ts';
  await f.put(path, 'export const x = true;');
  const batch = 'batch-2026-11-08T04-29-20-256Z-12345';
  await f.put(`artifacts/maintenance/quarantine/${batch}/manifest.json`, JSON.stringify({
    name:batch, version:2, status:'failed', moved:[], movedDirs:[],
  }));
  await assert.rejects(quarantineFiles(f.root, [f.candidate(path,'export const x = true;')], {apply:true}), /Unfinished cleanup/);
  assert.equal(await readFile(join(f.root,path),'utf8'),'export const x = true;');
  assert.equal(await restoreBatch(f.root,batch),0);
  const next = await quarantineFiles(f.root, [f.candidate(path,'export const x = true;')], {apply:true});
  assert.ok(next);
  await restoreBatch(f.root,next);
});
