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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
};

export default nextConfig;
