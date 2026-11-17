/**
 * Fail-closed migration policy. A syntax check is not a risk assessment.
 * This is a narrow allowlist for AUTO-deploy; non-allowlisted SQL still runs in
 * disposable DB CI but requires manual remote deployment.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';

export const MIGRATION_DIR = resolve(import.meta.dirname, '../../supabase/migrations');
const LOCK_PATH = resolve(import.meta.dirname, 'supabase-migrations.lock.json');
export const AUTO_MARKER = '-- greenplus:autodeploy-safe';

function maskLiteralsAndComments(source) {
  // Retain SQL code (not the content of text literals and comments). This
  // avoids recognizing forbidden keywords or semicolons inside strings.
  let output = '', i=0, mode='code', tag='';
  while (i < source.length) {
    const c = source[i], two = source.slice(i,i+2);
    if(mode==='line') { if(c==='\n') { mode='code';output+='\n'; } else output+=' '; i++;continue; }
    if(mode==='block') { if(two==='*/'){output+='  ';i+=2;mode='code';}else{output+=c==='\n'?'\n':' ';i++;} continue; }
    if(mode==='single') {if(two==="''"){output+='  ';i+=2;}else if(c==="'"){output+=' ';i++;mode='code';}else{output+=c==='\n'?'\n':' ';i++;}continue;}
    if(mode==='double') {if(two==='""'){output+='  ';i+=2;}else if(c==='"'){output+=' ';i++;mode='code';}else{output+=c==='\n'?'\n':' ';i++;}continue;}
    if(mode==='dollar') {if(source.startsWith(tag,i)){output+=' '.repeat(tag.length);i+=tag.length;mode='code';}else{output+=c==='\n'?'\n':' ';i++;}continue;}
    if(two==='--'){output+='  ';i+=2;mode='line';continue;}
    if(two==='/*'){output+='  ';i+=2;mode='block';continue;}
    if(c==="'"){output+=' ';i++;mode='single';continue;}
    if(c==='"'){output+=' ';i++;mode='double';continue;}
    const m=/^\$[a-zA-Z_][a-zA-Z_0-9]*\$|^\$\$/.exec(source.slice(i));
    if(m){tag=m[0];output+=' '.repeat(tag.length);i+=tag.length;mode='dollar';continue;}
    output+=c;i++;
  }
  if (mode==='block'||mode==='single'||mode==='double'||mode==='dollar') throw new Error(`Unterminated SQL ${mode}`);
  return output;
}
export function classifySQL(source) {
  let code;
  try{code=maskLiteralsAndComments(source);}catch(e){return{autoSafe:false, reasons:[e.message]};}
  const statements = code.split(';').map(x=>x.trim().replace(/\s+/g,' ')).filter(Boolean);
  if(!statements.length) return {autoSafe:false,reasons:['Empty migration']};
  const reasons=[];
  if(!source.trimStart().startsWith(AUTO_MARKER)) reasons.push(`Missing required first-line ${AUTO_MARKER}`);
  for (const sql of statements) {
    if (/^(BEGIN|COMMIT)$/i.test(sql)) continue;
    // Nullable, no default, no backfill, no constraint, no table rewrite.
    if (/^ALTER TABLE (?:IF EXISTS )?public\.[a-z][a-z_0-9]* ADD COLUMN IF NOT EXISTS [a-z][a-z_0-9]* (?:uuid|text|boolean|integer|bigint|numeric(?:\(\d{1,2},\d{1,2}\))?|timestamptz|timestamp(?: with time zone)?|date|jsonb)(?: NULL)?$/i.test(sql)) continue;
    if (/^COMMENT ON (?:TABLE|COLUMN) public\.[a-z][a-z_0-9]*(?:\.[a-z][a-z_0-9]*)? IS\s*$/i.test(sql)) continue;
    reasons.push(`Manual review: ${sql.slice(0,110)}`);
  }
  return {autoSafe: reasons.length===0, reasons, statements:statements.length};
}
export function inventoryMigrations(dir=MIGRATION_DIR) {
  const files = readdirSync(dir).filter(x=>x.endsWith('.sql')).sort();
  const versions = new Set();
  const rows = files.map(file=>{
    const m=/^(\d{4,14})_[a-z0-9_]+\.sql$/.exec(file);
    if(!m) throw new Error(`Unexpected migration file name: ${file}`);
    if(versions.has(m[1])) throw new Error(`Duplicate migration version: ${m[1]}`);
    versions.add(m[1]);
    const content=readFileSync(resolve(dir,file),'utf8');
    return {file,version:m[1],sha256:createHash('sha256').update(content).digest('hex'),...classifySQL(content)};
  });
  for(let i=1;i<rows.length;i++) if(rows[i-1].version>=rows[i].version) throw new Error('Migration versions are not ascending');
  return rows;
}
export function verifyImmutableBaseline(rows=inventoryMigrations(),lock=JSON.parse(readFileSync(LOCK_PATH,'utf8'))) {
  for(const [file,expected] of Object.entries(lock.immutable_migrations)) {
    const actual=rows.find(r=>r.file===file);
    if(!actual) throw new Error(`Removed baseline migration: ${file}`);
    if(actual.sha256!==expected) throw new Error(`Historical migration edited: ${file}. Never rewrite applied SQL; add a new migration.`);
  }
  return true;
}

export function parseMigrationList(output) {
  const found=[];
  for(const line of output.split(/\r?\n/)) {
    if(!/[│|]/.test(line)) continue;
    const parts=line.split(/[│|]/).map(p=>p.trim());
    if(parts.length<2)continue;
    const local=/^\d{4,14}$/.test(parts[0])?parts[0]:null;
    const remote=/^\d{4,14}$/.test(parts[1])?parts[1]:null;
    if(local||remote)found.push({local,remote});
  }
  if(!found.length)throw new Error('Unable to parse Supabase migration list; fail closed (do not guess remote state)');
  return found;
}
/** Read-only assessment: validates the version prefix while reporting pending manual SQL.
 * This is NOT an assertion that live SQL bytes or Auth/Storage match the repository. */
export function inspectRemoteMigrations(localRows, listOutput) {
  const parsed = parseMigrationList(listOutput);
  const localVersions = localRows.map(r => r.version);
  const applied = parsed.filter(x => x.remote !== null).map(x => x.remote);
  if (!applied.length) throw new Error('No remote baseline history. Bootstrap/reconcile manually; no automatic first deployment.');
  const seen = new Set();
  for (const version of applied) {
    if (seen.has(version)) throw new Error(`Duplicate remote history version ${version}`);
    seen.add(version);
  }
  // Historical prefix required. No orphan remote migration, no gaps.
  if (applied.some((v, i) => localVersions[i] !== v))
    throw new Error('Remote migration history diverges from repository prefix. Manual reconciliation required.');
  const pendingRows = localRows.slice(applied.length);
  return {
    applied: applied.length,
    pending: pendingRows.map(x => x.file),
    pendingManual: pendingRows.filter(x => !x.autoSafe).map(x => ({ file: x.file, reasons: x.reasons })),
    upToDate: pendingRows.length === 0,
  };
}

export function planRemoteMigrations(localRows, listOutput) {
  const report = inspectRemoteMigrations(localRows, listOutput);
  if (report.pendingManual.length)
    throw new Error(`Pending migrations require manual deployment: ${report.pendingManual.map(x => `${x.file}: ${x.reasons.join(', ')}`).join(' | ')}`);
  return { applied: report.applied, pending: report.pending };
}
