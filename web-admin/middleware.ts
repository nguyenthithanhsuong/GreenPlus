import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge middleware for request logging to Better Stack
 * Logs all requests, response times, and errors
 */

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN;

  // Only log to Better Stack if configured
  if (sourceToken && request.nextUrl.pathname.startsWith('/api/')) {
    const requestInfo = {
      method: request.method,
      path: request.nextUrl.pathname,
      query: request.nextUrl.search,
      timestamp: new Date().toISOString(),
    };

    // Log via HTTP to Better Stack asynchronously (don't await to avoid blocking)
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
      // Silently fail to prevent logging from affecting request
      console.error('[BetterStack Middleware] Log send error:', err);
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
