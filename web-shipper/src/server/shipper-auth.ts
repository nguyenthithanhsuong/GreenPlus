// Server-only: imported exclusively by Next.js route handlers.
import { cookies } from 'next/headers';
import { shipperDb } from './shipper-db';
import { SESSION_COOKIE } from '../lib/shipper-session';
import { verifyPassword, hashPassword, createShipperSession, verifyShipperSession } from '../lib/shipper-security.mjs';

export class ShipperError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) { super(message); }
}

export type ShipperUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
};

type UserWithPassword = ShipperUser & { password: string };

const basicFields = 'user_id,name,email,phone,status';

function dbError(): never { throw new ShipperError('Không thể truy cập dữ liệu Shipper', 503, 'DATABASE_UNAVAILABLE'); }

export async function signInShipper(email: string, password: string): Promise<{user: ShipperUser; token: string}> {
  if (!process.env.SHIPPER_SESSION_SECRET || Buffer.byteLength(process.env.SHIPPER_SESSION_SECRET) < 32) {
    throw new ShipperError('Chưa cấu hình SHIPPER_SESSION_SECRET cho Web Shipper', 503, 'SESSION_NOT_CONFIGURED');
  }
  const db = shipperDb();
  const { data, error } = await db.from('users')
    .select(`${basicFields},password,roles!inner(is_shipper)`)
    .ilike('email', email.toLowerCase()).eq('roles.is_shipper', true).limit(1).maybeSingle();
  if (error) dbError();
  // Deliberately identical messages for nonexistent users, wrong passwords and wrong roles.
  const invalid = new ShipperError('Email hoặc mật khẩu không đúng, hoặc tài khoản không có quyền Shipper', 401, 'INVALID_CREDENTIALS');
  const user = data as unknown as UserWithPassword | null;
  if (!user || user.status !== 'active' || !await verifyPassword(password, user.password)) throw invalid;
  if (!user.password.startsWith('pbkdf2$')) {
    const { error: upgradeError } = await db.from('users').update({ password: await hashPassword(password) })
      .eq('user_id', user.user_id).eq('password', user.password);
    if (upgradeError) dbError();
  }
  const publicUser: ShipperUser = {user_id:user.user_id, name:user.name, email:user.email, phone:user.phone, status:user.status};
  const token = createShipperSession(user.user_id, process.env.SHIPPER_SESSION_SECRET ?? '');
  return { user: publicUser, token };
}

export async function requireShipper(): Promise<ShipperUser> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const secret = process.env.SHIPPER_SESSION_SECRET;
  if (!secret) throw new ShipperError('Chưa cấu hình phiên đăng nhập Shipper', 503, 'SESSION_NOT_CONFIGURED');
  const userId = verifyShipperSession(token, secret);
  if (!userId) throw new ShipperError('Phiên đăng nhập đã hết hạn', 401, 'SESSION_INVALID');
  // Never trust only cookie claims: check current shipper role and active status every request.
  const { data, error } = await shipperDb().from('users')
    .select(`${basicFields},roles!inner(is_shipper)`)
    .eq('user_id', userId).eq('roles.is_shipper', true).maybeSingle();
  if (error) dbError();
  if (!data || data.status !== 'active') throw new ShipperError('Tài khoản Shipper không còn quyền truy cập', 403, 'SHIPPER_DENIED');
  const { user_id, name, email, phone, status } = data;
  return { user_id, name, email, phone, status };
}

export function shipperApiError(error: unknown): { message: string; status: number; code: string } {
  if (error instanceof ShipperError) return {message:error.message, status:error.status, code:error.code};
  console.error('[shipper/api]', {code: 'SHIPPER_INTERNAL_ERROR', type: error instanceof Error ? error.name : typeof error});
  return {message:'Dịch vụ Shipper tạm thời gặp lỗi. Kiểm tra cấu hình server.', status:503, code:'SHIPPER_INTERNAL_ERROR'};
}
