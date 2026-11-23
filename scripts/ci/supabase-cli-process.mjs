import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Only these fixed, internal subcommands can be sent through the Windows
// command processor. No arbitrary arguments, paths or user input are accepted.
// This avoids Node DEP0190 (shell:true + unescaped argv) while allowing the
// supabase.cmd shim exposed on PATH by npm exec to work on Windows.
const WINDOWS_COMMANDS = new Set([
  'migration list --linked',
  'db push --linked --dry-run',
  'db push --linked --yes',
]);

export function invokeSupabaseCli(argv, {
  platform = process.platform,
  cwd = process.cwd(),
  spawn = spawnSync,
  exists = existsSync,
} = {}) {
  const options = { encoding: 'utf8', timeout: 180000, windowsHide: true, cwd };
  if (platform === 'win32') {
    const subcommand = argv.join(' ');
    if (!WINDOWS_COMMANDS.has(subcommand)) {
      throw new Error('Unsupported Supabase CLI command on Windows; refused before invoking shell');
    }
    // npm exec prepends its CLI shim directory to PATH. Passing ONE constant
    // command string, and no args array, avoids shell-argument concatenation.
    return spawn(`supabase ${subcommand}`, { ...options, shell: true });
  }
  const local = resolve(cwd, 'node_modules/.bin/supabase');
  const executable = exists(local) ? local : 'supabase';
  return spawn(executable, argv, { ...options, shell: false });
}
