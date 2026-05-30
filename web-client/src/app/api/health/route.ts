import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Health check endpoint for uptime monitoring and load balancer checks
 * Returns 200 OK with service status
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    
    return NextResponse.json(
      {
        status: 'ok',
        service: 'web-client',
        timestamp,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || 'unknown',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'web-client',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
