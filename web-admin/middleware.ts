import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/register')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (PUBLIC_PATHS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN;

  if (sourceToken && pathname.startsWith('/api/')) {
    const requestInfo = {
      method: request.method,
      path: request.nextUrl.pathname,
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
        message: `API Request: ${request.method} ${request.nextUrl.pathname}`,
        source: 'web-admin-middleware',
        context: requestInfo,
      }),
    }).catch((err) => {
      
      console.error('[BetterStack Middleware] Log send error:', err);
    });
  }

  if (!hasAuthCookie(request)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
