import { BetterStackLogger } from "@greenplus/supabase-shared/logger";
// Tokens must never be exposed via NEXT_PUBLIC_ variables.
export const logger = new BetterStackLogger(
  process.env.BETTER_STACK_SOURCE_TOKEN ?? "",
  process.env.BETTER_STACK_URL ?? "https://in.logs.betterstack.com",
);
