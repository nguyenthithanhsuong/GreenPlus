import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Use the same single root .env as web-admin and web-client.
// npm workspace commands start Next.js with web-shipper as process.cwd().
// Existing OS/container environment values take precedence over the file.
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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
};

export default async function config(): Promise<NextConfig> {
  if (process.env.NODE_ENV === "development") return nextConfig;
  const { withSentryConfig } = await import("@sentry/nextjs/config");
  return withSentryConfig(nextConfig, {
    silent: process.env.SENTRY_DEBUG !== "true",
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT_SHIPPER,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  });
}
