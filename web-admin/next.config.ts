import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

loadEnv({ path: resolve(process.cwd(), "../.env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@greenplus/supabase-shared"],
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
});
