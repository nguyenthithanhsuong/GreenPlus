import { logger } from "@/lib/logger";

export async function GET() {
  console.log("API route hit");

  logger.info("🔥 test log from API route");

  return Response.json({ ok: true });
}