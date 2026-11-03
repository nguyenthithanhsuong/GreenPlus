import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../web-shipper/", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
test("Shipper initializes server/client Sentry with opt-in DSNs", () => {
  assert.match(read("instrumentation.ts"), /captureRequestError/);
  assert.match(read("instrumentation-client.ts"), /NEXT_PUBLIC_SENTRY_DSN_SHIPPER/);
  assert.match(read("sentry.server.config.ts"), /SENTRY_DSN_SHIPPER/);
  assert.match(read("src/server/shipper-auth.ts"), /Sentry\.captureException\(error\)/);
});
test("Shipper Better Stack secret is only read server side", () => {
  assert.match(read("src/lib/logger.ts"), /BETTER_STACK_SOURCE_TOKEN/);
  assert.doesNotMatch(read("src/lib/logger.ts"), /NEXT_PUBLIC_BETTER_STACK/);
  assert.match(read("src/app/api/shipper/deliveries/route.ts"), /logger\.error/);
});
