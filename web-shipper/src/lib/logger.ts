import { BetterStackLogger } from "@greenplus/supabase-shared/logger";

// Never use NEXT_PUBLIC_ variables for Better Stack tokens.
export const logger = new BetterStackLogger(
  process.env.BETTER_STACK_SOURCE_TOKEN ?? "",
  process.env.BETTER_STACK_URL ?? "https://in.logs.betterstack.com",
);
