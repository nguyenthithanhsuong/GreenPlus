/** Start the local Docker sandbox once, then run the existing three-web dev workflow.
 * No database reset or automatic migration occurs when the sandbox is already ready.
 */
import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectLocalAdmin } from './three-tier-connect-admin.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const composeDir = resolve(projectRoot, 'docker/three-tier');
const gateway = 'http://127.0.0.1:4100/ready';

export function dockerStartStrategy({ ready, hasGatewayContainer }) {
  if (ready && hasGatewayContainer) return 'reuse';
  return hasGatewayContainer ? 'resume' : 'bootstrap';
}

function docker(args, timeout = 120000) {
  const result = spawnSync('docker', ['compose', '--project-directory', composeDir, ...args], {
    cwd: composeDir, encoding: 'utf8', timeout, windowsHide: true,
  });
  if (result.error) {
    const reason = result.error.code === 'ENOENT' ? 'Docker CLI không có trong PATH.'
      : result.error.code === 'ETIMEDOUT' ? 'Docker Desktop phản hồi quá chậm.'
      : result.error.message;
    throw new Error(`${reason} Hãy mở Docker Desktop, hoặc chạy npm run dev:web nếu chỉ cần web.`);
  }
  if (result.status !== 0) {
    throw new Error(`Docker Compose thất bại: ${(result.stderr || result.stdout || '').trim()}\nKiểm tra Docker Desktop hoặc chạy npm run docker:three-tier:up để sửa cấu hình.`);
  }
  return (result.stdout || '').trim();
}

async function gatewayReady() {
  try {
    const response = await fetch(gateway, { signal: AbortSignal.timeout(3500) });
    const data = await response.json();
    return response.ok && data.status === 'ready';
  } catch { return false; }
}

async function ensureDocker() {
  docker(['version'], 30000);
  // Checking the port alone is insufficient: ensure the gateway belongs to our Compose project.
  const existing = docker(['ps', '--all', '--services'], 30000).split(/\r?\n/);
  const hasGatewayContainer = existing.includes('gateway');
  const strategy = dockerStartStrategy({ ready: await gatewayReady(), hasGatewayContainer });
  if (strategy === 'reuse') {
    console.log('[GreenPlus] Docker gateway đã sẵn sàng; không rebuild/migrate lại.');
    return;
  }
  if (strategy === 'resume') {
    console.log('[GreenPlus] Đang khởi động các container Docker đã có (không rebuild)...');
    docker(['up', '-d', '--no-build', '--wait', '--wait-timeout', '180'], 300000);
  } else {
    console.log('[GreenPlus] Chưa có Docker sandbox. Chạy bootstrap đầy đủ lần đầu...');
    const start = spawnSync(process.execPath, [resolve(projectRoot, 'scripts/three-tier-docker.mjs'), 'up'], {
      cwd: projectRoot, stdio: 'inherit', timeout: 1200000, windowsHide: true,
    });
    if (start.error || start.status !== 0) throw new Error(`Docker bootstrap thất bại: ${start.error?.message || `exit ${start.status}`}`);
  }
  if (!(await gatewayReady())) throw new Error('Docker đã khởi động nhưng gateway chưa Ready. Chạy npm run docker:three-tier:check để xem lỗi.');
  console.log('[GreenPlus] Docker Ready. Khởi động Admin, Client, Shipper...');
}

async function main() {
  try { await ensureDocker(); }
  catch (error) {
    console.error(`[GreenPlus] ${error.message}`);
    process.exitCode = 1;
    return;
  }
  // Root .env.local is not automatically loaded by the web-admin Next workspace.
  // Sync credentials only after verifying both the gateway and its auth key.
  // A remote/explicitly customized Admin target must never be overwritten.
  try {
    const linked = await connectLocalAdmin();
    console.log(`[GreenPlus] Admin ↔ Docker Local: ${linked.changed ? 'đã cấu hình, khởi động Next.js để nhận biến mới' : 'sẵn sàng'}.`);
  } catch (error) {
    console.error(`[GreenPlus] Không thể kết nối Admin Docker: ${error.message}`);
    console.error('[GreenPlus] Sử dụng npm run dev:web nếu chỉ cần các web app mà không bật Docker switch.');
    process.exitCode = 1;
    return;
  }
  const child = spawn('npm run dev:turbo', { cwd: projectRoot, stdio: 'inherit', shell: true, env: process.env });
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (stopping) return;
      stopping = true;
      // On Windows shell:true spawns cmd.exe; let the shell receive terminal Ctrl+C.
      if (process.platform !== 'win32') child.kill(signal);
    });
  }
  child.on('error', error => { console.error(`[GreenPlus] Không thể chạy web: ${error.message}`); process.exitCode = 1; });
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 130 : 1); });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
