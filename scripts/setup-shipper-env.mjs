import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootEnv = resolve(repositoryRoot, '.env');

/** Add only the missing Shipper session key to the existing shared .env. */
export function ensureShipperSecret(envFile, makeSecret = () => randomBytes(48).toString('hex')) {
  if (!existsSync(envFile)) {
    throw new Error('Không tìm thấy .env ở thư mục gốc GreenPlus. Hãy tạo/khôi phục file .env gốc trước.');
  }

  const content = readFileSync(envFile, 'utf8');
  const lines = content.split(/\r?\n/);
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter((key) => !lines.some((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z\d_]*)\s*=\s*(.*)$/);
    return match?.[1] === key && match[2].trim().length > 0;
  }));
  if (missing.length) {
    throw new Error(`Thiếu cấu hình trong .env gốc: ${missing.join(', ')}`);
  }

  const existing = lines.find((line) => /^\s*SHIPPER_SESSION_SECRET\s*=/.test(line));
  if (existing !== undefined) {
    const raw = existing.slice(existing.indexOf('=') + 1).trim();
    const value = raw.replace(/^(['"])(.*)\1$/, '$2');
    if (Buffer.byteLength(value, 'utf8') < 32) {
      throw new Error('SHIPPER_SESSION_SECRET hiện có quá ngắn (cần ít nhất 32 byte). Hãy thay bằng secret mạnh trong .env gốc.');
    }
    return 'exists';
  }

  const generated = makeSecret();
  if (typeof generated !== 'string' || Buffer.byteLength(generated, 'utf8') < 32 || /[\r\n]/.test(generated)) {
    throw new Error('Secret được tạo không hợp lệ');
  }
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const prefix = content.length === 0 || content.endsWith('\n') ? '' : eol;
  appendFileSync(envFile, `${prefix}${eol}# Secret for independent Web Shipper sessions (server only)${eol}SHIPPER_SESSION_SECRET=${generated}${eol}`);
  return 'created';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = ensureShipperSecret(rootEnv);
    console.log(result === 'created'
      ? 'Đã thêm SHIPPER_SESSION_SECRET vào .env gốc. Không tạo thêm file .env nào.'
      : 'SHIPPER_SESSION_SECRET đã tồn tại và đủ dài trong .env gốc; không thay đổi.');
    console.log('Khởi động lại Web Shipper để nhận cấu hình mới.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Không thể cập nhật cấu hình');
    process.exitCode = 1;
  }
}
