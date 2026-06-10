import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export const GET = withSentry(async () => {
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
});