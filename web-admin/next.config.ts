import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

loadEnv({ path: resolve(process.cwd(), "../.env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@greenplus/supabase-shared"],
};

const sentryDebug = process.env.SENTRY_DEBUG === "true";

export default withSentryConfig(nextConfig, {
  silent: !sentryDebug,
  debug: sentryDebug,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_ADMIN,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  //tunnelRoute: "/monitoring",

  release: process.env.GITHUB_SHA
    ? {
        name: process.env.GITHUB_SHA,
      }
    : undefined,
});
