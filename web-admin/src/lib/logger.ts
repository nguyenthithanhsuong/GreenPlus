import { BetterStackLogger } from "@greenplus/supabase-shared/logger";

export const logger = new BetterStackLogger(
  process.env.BETTER_STACK_SOURCE_TOKEN ?? process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN ?? "",
  process.env.BETTER_STACK_URL ?? process.env.NEXT_PUBLIC_BETTER_STACK_URL ?? "",
);