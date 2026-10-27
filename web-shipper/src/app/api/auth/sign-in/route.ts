import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../../../../lib/shipper-session';
import { signInShipper, shipperApiError } from '../../../../server/shipper-auth';
import { SESSION_HOURS } from '../../../../lib/shipper-security.mjs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Prevent browser-based cross-origin login and cookie injection.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Nguồn yêu cầu không hợp lệ' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== 'string' || typeof body?.password !== 'string' ||
      body.email.length > 254 || body.password.length > 1024 || !body.email.trim() || !body.password) {
    return NextResponse.json({ error: 'Email và mật khẩu không hợp lệ' }, { status: 400 });
  }
  try {
    const { user, token } = await signInShipper(body.email.trim(), body.password);
    const response = NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_HOURS * 60 * 60,
    });
    return response;
  } catch (error) {
    const result = shipperApiError(error);
    return NextResponse.json({error:result.message, code:result.code}, {
      status: result.status, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
