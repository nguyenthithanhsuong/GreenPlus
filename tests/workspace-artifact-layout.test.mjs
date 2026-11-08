import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const source = resolve(import.meta.dirname, '..');
const read = p => readFileSync(join(source, p), 'utf8');
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'greenplus-layout-'));
  mkdirSync(join(root, 'scripts'));
  for (const app of ['web-admin', 'web-client', 'web-shipper']) mkdirSync(join(root, app));
  return root;
}
function execute(root, script, args = []) {
  const result = spawnSync(process.execPath, [join(root, 'scripts', script), ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

test('cleanup preserves secret files and root dependencies, while removing app builds and moving reports', () => {
  const root = fixture();
  try {
    writeFileSync(join(root,'scripts','clean-workspaces.mjs'),read('scripts/clean-workspaces.mjs'));
    mkdirSync(join(root,'node_modules'));writeFileSync(join(root,'node_modules','keep.txt'),'root dependency');
    writeFileSync(join(root,'web-admin','.env.local'),'SECRET_KEEP');
    for (const app of ['web-admin','web-client','web-shipper']) {
      mkdirSync(join(root,app,'.next'));
      mkdirSync(join(root,app,'node_modules'));
      writeFileSync(join(root,app,'node_modules','generated.txt'),'temp');
      writeFileSync(join(root,app,'tsconfig.tsbuildinfo'),'cache');
    }
    mkdirSync(join(root,'web-shipper','playwright-report'));
    writeFileSync(join(root,'web-shipper','playwright-report','index.html'),'<html>report</html>');
    execute(root,'clean-workspaces.mjs',['--dry-run','--for-zip']);
    assert.ok(existsSync(join(root,'web-admin','.next')),'dry run must not remove anything');
    execute(root,'clean-workspaces.mjs',['--for-zip']);
    for (const app of ['web-admin','web-client','web-shipper']) {
      for (const path of ['.next','node_modules','tsconfig.tsbuildinfo']) assert.equal(existsSync(join(root,app,path)),false);
    }
    assert.equal(readFileSync(join(root,'web-admin','.env.local'),'utf8'),'SECRET_KEEP');
    assert.ok(existsSync(join(root,'node_modules','keep.txt')));
    const legacy = join(root,'artifacts','playwright','web-shipper','legacy');
    assert.ok(existsSync(legacy),'old reports must be moved to root diagnostics');
    assert.equal(existsSync(join(root,'web-shipper','playwright-report')),false);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('source ZIP is created without env, backups, dependencies or generated artifacts', () => {
  const root = fixture();
  try {
    writeFileSync(join(root,'scripts','package-source.mjs'),read('scripts/package-source.mjs'));
    writeFileSync(join(root,'package.json'),'{}');
    writeFileSync(join(root,'.env'),'PRIVATE_SECRET');
    writeFileSync(join(root,'backup_data.sql'),'PRIVATE_BACKUP');
    writeFileSync(join(root,'web-client','.env.local'),'PRIVATE_CLIENT');
    mkdirSync(join(root,'web-admin','src'));writeFileSync(join(root,'web-admin','src','code.txt'),'tracked source');
    mkdirSync(join(root,'web-shipper','node_modules'));writeFileSync(join(root,'web-shipper','node_modules','private.txt'),'DEPENDENCY');
    mkdirSync(join(root,'web-admin','.next'));writeFileSync(join(root,'web-admin','.next','cache.txt'),'ARTIFACT');
    mkdirSync(join(root,'supabase','.temp'), {recursive:true});
    writeFileSync(join(root,'supabase','.temp','project-ref'),'PRIVATE_PROJECT_REFERENCE');
    execute(root,'package-source.mjs');
    const zipPath = join(root,'artifacts',`GreenPlus_Source_${new Date().toISOString().slice(0,10)}.zip`);
    assert.ok(existsSync(zipPath));
    const raw = readFileSync(zipPath);
    assert.ok(raw.includes(Buffer.from('web-admin/src/code.txt')));
    for (const disallowed of ['.env.local','.env','backup_data.sql','private.txt','cache.txt','supabase/.temp/project-ref']) {
      assert.equal(raw.includes(Buffer.from(disallowed)),false,`should exclude ${disallowed}`);
    }
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('ports are consistent between dev, start, prewarm, Docker, nginx and CI', () => {
  const root=JSON.parse(read('package.json'));
  assert.equal(root.scripts['clean:zip'],'node scripts/clean-workspaces.mjs --for-zip');
  for (const [name,port] of [['admin',3000],['client',3001],['shipper',3002]]) {
    const config=JSON.parse(read(`web-${name}/package.json`));
    assert.match(config.scripts.dev,new RegExp(`-p ${port}$`));
    assert.match(config.scripts.start,new RegExp(`-p ${port}$`));
    assert.match(read(`web-${name}/tsconfig.json`),new RegExp(`\\.cache/tsbuild/web-${name}\\.tsbuildinfo`));
    assert.match(read('scripts/prewarm-dev.mjs'),new RegExp(`folder: "web-${name}", port: ${port}`));
    assert.match(read('nginx/nginx.conf'),new RegExp(`server web-${name}:${port};`));
    assert.match(read(`web-${name}/Dockerfile`),new RegExp(`EXPOSE ${port}`));
  }
  const compose=read('docker-compose.yml');
  assert.match(compose,/WEB_ADMIN_PORT:-3000\}:3000/);
  assert.match(compose,/WEB_CLIENT_PORT:-3001\}:3001/);
  assert.match(compose,/WEB_SHIPPER_PORT:-3002\}:3002/);
});

test('Playwright reports are rooted, and CI artifact upload reads the new paths', () => {
  const config = read('web-shipper/playwright.config.ts');
  const ci = read('.github/workflows/ci.yml');
  assert.match(config,/artifacts\/playwright\/web-shipper/);
  assert.match(config,/outputDir:/);
  for (const path of ['artifacts/playwright/web-shipper/report/','artifacts/playwright/web-shipper/test-results/'])
    assert.ok(ci.includes(path),`CI should upload ${path}`);
  assert.ok(read('.gitignore').includes('artifacts/'));
});
