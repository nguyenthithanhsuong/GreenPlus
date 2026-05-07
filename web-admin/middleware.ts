import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CLIENT_LOGIN_URL = process.env.NEXT_PUBLIC_WEB_CLIENT_URL ?? 'http://localhost:3000';
const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/_next', '/favicon.ico', '/public'];

function hasAuthCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get('gp_access_token') || request.cookies.get('gp_portal_session')
  );
}

export function middleware(request: NextRequest) {
  const sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return NextResponse.redirect(`${CLIENT_LOGIN_URL}${pathname}`);
  }

  if (sourceToken && pathname.startsWith('/api/')) {
    const requestInfo = {
      method: request.method,
      path: pathname,
      query: request.nextUrl.search,
      timestamp: new Date().toISOString(),
    };

    fetch('https://in.betterstack.com/api/v1/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sourceToken}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level: 'INFO',
        message: `API Request: ${request.method} ${pathname}`,
        source: 'web-admin-middleware',
        context: requestInfo,
      }),
    }).catch((err) => {
      console.error('[BetterStack Middleware] Log send error:', err);
    });
  }

  if (PUBLIC_PATHS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (!hasAuthCookie(request)) {
    return NextResponse.redirect(`${CLIENT_LOGIN_URL}/login`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
