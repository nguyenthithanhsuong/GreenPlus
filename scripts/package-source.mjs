/** Source-only ZIP using built-in Node.js, no extra dependencies (safe on Windows).
 * Never archives credentials, database dumps, node_modules, build outputs or reports.
 * Usage: npm run zip:source
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const excludedDirs = new Set([
  '.git', '.next', '.turbo', '.cache', 'node_modules', 'artifacts', '.vercel',
  'playwright-report', 'test-results', 'coverage', '.nyc_output', 'dist', 'out',
  '.gradle', '.dart_tool', 'build', '__pycache__', '.pytest_cache', '.idea', '.vscode',
]);
const sensitiveNames = new Set(['backup_data.sql', 'backup_schema.sql', '.DS_Store']);
function exclude(name, directory) {
  const lower = name.toLowerCase();
  if (directory) return excludedDirs.has(lower) || lower === 'backups';
  if (sensitiveNames.has(lower) || lower.endsWith('.tsbuildinfo') || lower.endsWith('.log')) return true;
  if (/^\.env(?:\..*)?$/.test(name) && !/^\.env(?:\.docker)?\.example$/.test(name)) return true;
  if (/\.(?:jks|keystore|pem|p12|pfx|key|apk|aab|sqlite|db|pyc|bak|tmp)$/i.test(name)) return true;
  if (/^backup.*\.sql$/i.test(name) || /\.sql\.bak$/i.test(name)) return true;
  return false;
}
const filePaths = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || exclude(entry.name, entry.isDirectory())) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile()) filePaths.push(path);
  }
}
await walk(root);
filePaths.sort();
if (filePaths.length > 65535) throw Error('ZIP64 not supported; too many files');

const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  table[n] = c >>> 0;
}
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const zipParts = [], centralParts = [];
let offset = 0;
for (const path of filePaths) {
  const name = relative(root, path).split(sep).join('/');
  const nameBytes = Buffer.from(name);
  const original = await readFile(path);
  const zipped = deflateRawSync(original, { level: 6 });
  if (offset > 0xffffffff || original.length > 0xffffffff || zipped.length > 0xffffffff) throw Error('ZIP64 not supported');
  const crc = crc32(original);
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50,0); head.writeUInt16LE(20,4);
  head.writeUInt16LE(0x0800,6); head.writeUInt16LE(8,8); // UTF-8, deflate
  head.writeUInt32LE(crc,14); head.writeUInt32LE(zipped.length,18);
  head.writeUInt32LE(original.length,22); head.writeUInt16LE(nameBytes.length,26);
  zipParts.push(head,nameBytes,zipped);
  const cd=Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50,0); cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);
  cd.writeUInt16LE(0x0800,8);cd.writeUInt16LE(8,10);
  cd.writeUInt32LE(crc,16);cd.writeUInt32LE(zipped.length,20);
  cd.writeUInt32LE(original.length,24);cd.writeUInt16LE(nameBytes.length,28);
  cd.writeUInt32LE(offset,42);
  centralParts.push(cd,nameBytes);
  offset+=head.length+nameBytes.length+zipped.length;
}
const central=Buffer.concat(centralParts);
const end=Buffer.alloc(22);
end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(filePaths.length,8);
end.writeUInt16LE(filePaths.length,10);end.writeUInt32LE(central.length,12);
end.writeUInt32LE(offset,16);
const output=join(root,'artifacts',`GreenPlus_Source_${new Date().toISOString().slice(0,10)}.zip`);
await mkdir(dirname(output),{recursive:true});
await writeFile(output,Buffer.concat([...zipParts,central,end]));
console.log(`Created source-only ZIP: ${output} (${filePaths.length} files).`);
console.log('Excluded local .env, credentials, backups, node_modules, Next.js builds and Playwright artifacts.');
