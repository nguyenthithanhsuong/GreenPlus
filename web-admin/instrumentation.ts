import { logger } from "@/lib/logger"; 

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    logger.info("web-admin started", { runtime: "nodejs" });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
    logger.info("web-admin started", { runtime: "edge" });
  }
}