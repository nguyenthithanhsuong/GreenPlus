import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    
    return NextResponse.json(
      {
        status: 'ok',
        service: 'web-admin',
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
        service: 'web-admin',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
