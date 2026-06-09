import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { logger } from "../../../../../packages/supabase-shared/src/logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();

    logger.info("Health check request");

    const response = {
      status: "ok",
      service: "web-client",
      timestamp,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "unknown",
    };

    logger.info("Health check success", {
      uptime: response.uptime,
      environment: response.environment,
      version: response.version,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error("Health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        status: "error",
        service: "web-client",
        timestamp: new Date().toISOString(),
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
