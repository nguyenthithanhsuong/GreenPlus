/**
 * Idempotent migration from deprecated Sentry client bootstrap files to
 * instrumentation-client.ts. This never touches .env, source maps or data.
 * Run once after extracting the accompanying GreenPlus patch.
 */
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaces = [
  { path: "web-admin", dsn: "NEXT_PUBLIC_SENTRY_DSN_ADMIN" },
  { path: "web-client", dsn: "NEXT_PUBLIC_SENTRY_DSN_CLIENT" },
];

// Validate every workspace before deleting anything. Fail closed if somebody
// customized the old configuration and a manual merge is necessary.
for (const { path, dsn } of workspaces) {
  const current = join(root, path, "instrumentation-client.ts");
  if (!existsSync(current)) throw new Error(`${path}: missing instrumentation-client.ts; not deleting legacy configuration`);
  const source = readFileSync(current, "utf8");
  for (const marker of ["Sentry.init(", "onRouterTransitionStart", dsn, "NEXT_PUBLIC_GITHUB_SHA"]) {
    if (!source.includes(marker)) throw new Error(`${path}: instrumentation-client.ts lacks ${marker}; not deleting legacy configuration`);
  }
  const legacy = join(root, path, "sentry.client.config.ts");
  if (!existsSync(legacy)) continue;
  const oldSource = readFileSync(legacy, "utf8");
  if (!oldSource.includes("Sentry.init(") || !oldSource.includes(dsn)) {
    throw new Error(`${path}: customized sentry.client.config.ts detected; review manually before deleting`);
  }
}
for (const { path } of workspaces) {
  const legacy = join(root, path, "sentry.client.config.ts");
  if (!existsSync(legacy)) {
    console.log(`${path}: no deprecated Sentry config present`);
    continue;
  }
  unlinkSync(legacy);
  console.log(`${path}: removed deprecated sentry.client.config.ts (replacement already in instrumentation-client.ts)`);
}
console.log("Sentry migration complete; .env, database and Docker volumes untouched.");
