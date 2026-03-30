import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

loadEnv({ path: resolve(process.cwd(), "../.env.shared.local") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@greenplus/supabase-shared"],
};

export default nextConfig;
