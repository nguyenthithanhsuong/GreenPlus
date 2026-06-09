
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

loadEnv({ path: resolve(process.cwd(), "../.env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@greenplus/supabase-shared"],
};

export default withSentryConfig(nextConfig, {
  silent: false,
  debug: true,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_CLIENT,

  authToken: process.env.SENTRY_AUTH_TOKEN,

  release: {
    name: process.env.GITHUB_SHA,
  },
});