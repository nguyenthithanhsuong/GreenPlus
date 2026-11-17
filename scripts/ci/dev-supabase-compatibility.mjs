#!/usr/bin/env node
/** Read-only Supabase preflight. Never link projects, push SQL, reset DBs or use Docker. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const remoteModes = new Set(['auto', 'off', 'required']);

export function remoteCheckDecision({ mode = 'auto', linked = false, cliAvailable = false } = {}) {
  if (!remoteModes.has(mode)) throw Error('GREENPLUS_DEV_SUPABASE_REMOTE_CHECK must be auto, off or required');
  if (mode === 'off') return { run: false, fatal: false, reason: 'disabled explicitly' };
  if (!linked) return { run: false, fatal: mode === 'required', reason: 'Supabase project not linked (supabase/.temp/project-ref missing)' };
  if (!cliAvailable) return { run: false, fatal: mode === 'required', reason: 'Supabase CLI not installed or unavailable in PATH' };
  return { run: true, fatal: mode === 'required', reason: 'remote read-only check' };
}

function execNode(script, args = [], { timeout = 60000 } = {}) {
  const result = spawnSync(process.execPath, [resolve(root, script), ...args], {
    cwd: root, stdio: 'inherit', timeout, windowsHide: true,
  });
  if (result.error || result.status !== 0)
    throw Error(`${script} failed (${result.error?.message || `exit ${result.status}`}).`);
}

function supabaseExecutable() {
  // Do NOT use `npx` here: an automatic development preflight must not install packages.
  const local = resolve(root, 'node_modules/.bin', process.platform === 'win32' ? 'supabase.cmd' : 'supabase');
  const command = existsSync(local) ? local : 'supabase';
  const result = spawnSync(command, ['--version'], {
    cwd: root, encoding: 'utf8', timeout: 8000, windowsHide: true,
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
  });
  return !result.error && result.status === 0;
}

async function main() {
  execNode('scripts/ci/supabase-migration-gate.mjs', ['--static']);
  execNode('scripts/ci/check-storage.mjs');
  const mode = process.argv.includes('--require-remote') ? 'required' :
    process.env.GREENPLUS_DEV_SUPABASE_REMOTE_CHECK || 'auto';
  if (!remoteModes.has(mode)) throw Error('GREENPLUS_DEV_SUPABASE_REMOTE_CHECK must be auto, off or required');
  const projectRef = resolve(root, 'supabase/.temp/project-ref');
  const linked = existsSync(projectRef) && Boolean(readFileSync(projectRef, 'utf8').trim());
  const decision = remoteCheckDecision({ mode, linked, cliAvailable: linked ? supabaseExecutable() : false });
  if (!decision.run) {
    const message = `Supabase cloud migration compatibility NOT VERIFIED: ${decision.reason}.`;
    if (decision.fatal) throw Error(message);
    console.warn(`[GreenPlus] WARN ${message}`);
    console.warn('[GreenPlus] Run npx supabase link --project-ref YOUR_PROJECT_REF, then npm run supabase:migrations:status (read only).');
  } else {
    try {
      execNode('scripts/ci/supabase-migration-gate.mjs', [mode === 'required' ? '--require-up-to-date' : '--report'], { timeout: 180000 });
    } catch (error) {
      if (decision.fatal) throw error;
      console.warn(`[GreenPlus] WARN Remote Supabase NOT VERIFIED or incompatible: ${error.message}`);
    }
  }
  if (process.env.GREENPLUS_DEV_SUPABASE_STORAGE_LIVE === 'true') {
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) throw Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL required for live Storage check.');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw Error('SUPABASE_SERVICE_ROLE_KEY required for live Storage check.');
    execNode('scripts/ci/check-storage.mjs', ['--live'], { timeout: 30000 });
  } else {
    console.log('[GreenPlus] Supabase Storage: static PASS; live bucket contents/policies NOT VERIFIED (set GREENPLUS_DEV_SUPABASE_STORAGE_LIVE=true with server credentials for read-only check).');
  }
  console.log('[GreenPlus] Supabase preflight completed; zero remote writes. This does NOT certify Docker full parity.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`[GreenPlus] BLOCKED: ${error.message}`); process.exitCode = 1; });
}
