import test from "node:test";
import assert from "node:assert/strict";
import { createTenantPostgrestAdapter, TenantDataError } from "../packages/tenant-routing/postgrest-adapter.mjs";
import { resolveTenantDataRoute } from "../packages/tenant-routing/registry.mjs";

const A = "00000000-0000-4000-8000-000000000001";
const B = "00000000-0000-4000-8000-000000000002";
const ID = "10000000-0000-4000-8000-000000000001";
const registry = { store_id: A, storage_tier: "pro", storage_provider: "docker-postgres", storage_key: "pro_a", provisioning_state: "ready" };
const route = resolveTenantDataRoute({ storeId: A, record: registry, targets: {
  "docker-postgres:pro_a": { tier: "pro", kind: "postgrest", schema: "pro_a", databaseKey: "shared", url: "http://shared-rest:3000/" },
} });
function harness(returnRows = [{ product_id: ID, store_id: A, name: "Apple" }]) {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url: new URL(url), init });
    return new Response(JSON.stringify(returnRows), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  return { adapter: createTenantPostgrestAdapter({ route, headers: { Authorization: "Bearer test-only" }, fetchImpl }), requests };
}
test("list and find enforce tenant ownership, profile and no redirect", async () => {
  const { adapter, requests } = harness();
  await adapter.list("products", { limit: 5, offset: 10 });
  assert.equal(requests[0].url.searchParams.get("store_id"), `eq.${A}`);
  assert.equal(requests[0].url.searchParams.get("limit"), "5");
  assert.equal(requests[0].url.searchParams.get("offset"), "10");
  assert.equal(requests[0].init.headers.get("Accept-Profile"), "pro_a");
  assert.equal(requests[0].init.headers.get("Content-Profile"), "pro_a");
  assert.equal(requests[0].init.redirect, "error");
  assert.equal(requests[0].init.cache, "no-store");
  await adapter.find("products", ID);
  assert.equal(requests[1].url.searchParams.get("product_id"), `eq.${ID}`);
  assert.equal(requests[1].url.searchParams.get("store_id"), `eq.${A}`);
});
test("insert sets server-derived store ID and denies forged ownership", async () => {
  const { adapter, requests } = harness();
  await adapter.insert("products", { name: "Apple" });
  assert.equal(JSON.parse(requests[0].init.body).store_id, A);
  assert.equal(requests[0].init.headers.get("Prefer"), "return=representation");
  await assert.rejects(() => adapter.insert("products", { store_id: B, name: "Banana" }), /ownership/);
  assert.equal(requests.length, 1);
});
test("updates and deletes always require id AND tenant predicate", async () => {
  const { adapter, requests } = harness();
  await adapter.update("products", ID, { name: "Updated" });
  await adapter.delete("products", ID);
  for (const request of requests) {
    assert.equal(request.url.searchParams.get("product_id"), `eq.${ID}`);
    assert.equal(request.url.searchParams.get("store_id"), `eq.${A}`);
    assert.equal(request.init.headers.get("Prefer"), "return=representation");
  }
  await assert.rejects(() => adapter.update("products", ID, { store_id: A }), /ownership/);
});
test("cross-store responses are rejected rather than returned", async () => {
  const { adapter } = harness([{ store_id: B, product_id: ID }]);
  await assert.rejects(() => adapter.list("products"), /Unexpected tenant data response/);
});
test("missing auth, invalid collections/IDs and pagination fail before fetch", async () => {
  assert.throws(() => createTenantPostgrestAdapter({ route, headers: {} }), /credentials/);
  const { adapter, requests } = harness();
  await assert.rejects(() => adapter.list("tenant_storage_registry"), TenantDataError);
  await assert.rejects(() => adapter.find("products", "../../other-store"), /Invalid record identifier/);
  await assert.rejects(() => adapter.list("products", { limit: -2 }), /Invalid pagination/);
  assert.equal(requests.length, 0);
});
test("an upstream transport failure never retries on other tenants/providers", async () => {
  let count = 0;
  const adapter = createTenantPostgrestAdapter({ route, headers: { Authorization: "Bearer test-only" }, fetchImpl: async () => { count++; throw new Error("timeout"); } });
  await assert.rejects(() => adapter.list("products"), /transport unavailable/);
  assert.equal(count, 1);
});
test("an upstream non-2xx response fails closed", async () => {
  const adapter = createTenantPostgrestAdapter({ route, headers: { Authorization: "Bearer test-only" }, fetchImpl: async () => new Response("error", { status: 503 }) });
  await assert.rejects(() => adapter.list("products"), /failed \(503\)/);
});
