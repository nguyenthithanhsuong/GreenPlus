import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger"; 

export const runtime = 'nodejs';

export const GET = withSentry(async (request: Request) => {
  logger.info("Health check attempt");

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
    logger.error("Health check failed", { error: error instanceof Error ? error.message : 'Unknown error' });
    
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
});