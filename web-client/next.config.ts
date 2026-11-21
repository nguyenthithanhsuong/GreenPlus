import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// All three Next.js apps use the same ignored root environment files.
// Local overrides come first; existing OS/Vercel/CI variables retain priority.
// Do not create workspace .env.local files; Next.js auto-loads those separately.
loadEnv({ path: resolve(process.cwd(), "../.env.local") });
loadEnv({ path: resolve(process.cwd(), "../.env") });

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: resolve(process.cwd(), ".."),
  reactCompiler: true,
  async headers() {
    return [{
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }];
  },
  transpilePackages: ["@greenplus/supabase-shared"],
};

const sentryDebug = process.env.SENTRY_DEBUG === "true";

export default async function config(): Promise<NextConfig> {
  if (process.env.NODE_ENV === "development") {
    return nextConfig;
  }

  const { withSentryConfig } = await import("@sentry/nextjs/config");

  return withSentryConfig(nextConfig, {
    silent: !sentryDebug,
    debug: sentryDebug,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT_CLIENT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    release: process.env.GITHUB_SHA
      ? { name: process.env.GITHUB_SHA }
      : undefined,
  });
}
