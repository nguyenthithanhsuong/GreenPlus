/**
 * Original migration lockfiles were recorded from a mixed-CRLF/LF Windows tree.
 * Git's *.sql text eol=lf checkout normalization otherwise changes their raw
 * SHA-256 on Linux. Only the nine reviewed *historically CRLF* files are
 * reconstructed to their original CRLF bytes for hashing. No SQL tokens,
 * whitespace beyond line endings, files, or pinned digest values are changed.
 */
import { createHash } from 'node:crypto';

export const originallyCrlfMigrations = Object.freeze([
  '0001_baseline_greenplus.sql',
  '0002_rls_improved_greenplus.sql',
  '0003_align_runtime_status_constraints.sql',
  '0004_create_tenant_core.sql',
  '0005_add_store_scope.sql',
  '0007_add_nullable_store_fks.sql',
  '0008_protect_new_tenant_tables.sql',
  '0009_features_v2.sql',
  '0011_sync_manager_assignment.sql',
]);
const originallyCrlfSet = new Set(originallyCrlfMigrations);

export function pinnedMigrationSha256(filename, source) {
  if (typeof source !== 'string') throw new TypeError('Migration source must be UTF-8 text');
  // A lone CR is not a Git checkout transformation: treat it as drift.
  if (/\r(?!\n)/.test(source)) throw new Error(`Invalid line endings in ${filename}`);
  const historical = originallyCrlfSet.has(filename)
    ? source.replace(/\r?\n/g, '\r\n') : source;
  return createHash('sha256').update(historical, 'utf8').digest('hex');
}
