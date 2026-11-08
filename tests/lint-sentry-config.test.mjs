import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

test("Docker gateway marks untrusted JSON response as unknown, never any", () => {
  const declaration = read("web-admin/backend/core/docker-gateway.d.mts");
  assert.match(declaration, /data:\s*unknown/);
  assert.doesNotMatch(declaration, /data:\s*any\b/);
});

test("Admin and Client use one modern Sentry browser bootstrap", () => {
  for (const [app, dsn] of [
    ["web-admin", "NEXT_PUBLIC_SENTRY_DSN_ADMIN"],
    ["web-client", "NEXT_PUBLIC_SENTRY_DSN_CLIENT"],
  ]) {
    const source = read(`${app}/instrumentation-client.ts`);
    assert.match(source, /Sentry\.init\(/);
    assert.match(source, /onRouterTransitionStart/);
    assert.ok(source.includes(dsn));
    assert.match(source, /NEXT_PUBLIC_GITHUB_SHA/);
    assert.match(source, /environment:\s*process\.env\.NODE_ENV/);
    assert.equal(existsSync(join(root, app, "sentry.client.config.ts")), false, `${app}: remove deprecated Sentry bootstrap`);
  }
});
