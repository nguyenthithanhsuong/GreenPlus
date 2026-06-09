import { logger } from "../packages/supabase-shared/src"; 

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    logger.info("web-client started", { runtime: "nodejs" });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
    logger.info("web-client started", { runtime: "edge" });
  }
}
