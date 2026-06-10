import { withSentry } from "@/lib/with-sentry";
import { logger } from "@/lib/logger";

export const GET = withSentry(async () => {
  console.log("API route hit");

  logger.info("test log from API route");

  return Response.json({ ok: true });
});