import test from "node:test";
import assert from "node:assert/strict";
import { resolveTenantDataRoute, validateStorageRecord, TenantRoutingError } from "../packages/tenant-routing/registry.mjs";

const A = "00000000-0000-4000-8000-000000000001";
const B = "00000000-0000-4000-8000-000000000002";
const record = (storage_tier = "regular", storage_provider = "supabase-postgres", storage_key = "primary") =>
  ({ store_id: A, storage_tier, storage_provider, storage_key, provisioning_state: "ready" });
const targets = Object.freeze({
  "supabase-postgres:primary": { tier: "regular", kind: "supabase", databaseKey: "primary", schema: "public", url: "https://demo.supabase.co/rest/v1/" },
  "docker-postgres:shared": { tier: "regular", kind: "postgrest", databaseKey: "shared", schema: "public", url: "http://shared-rest:3000/" },
  "docker-postgres:pro_a": { tier: "pro", kind: "postgrest", databaseKey: "shared", schema: "pro_a", url: "http://shared-rest:3000/" },
  "docker-postgres:enterprise_a": { tier: "enterprise", kind: "postgrest", databaseKey: "enterprise_a", schema: "public", url: "http://enterprise-a-rest:3000/" },
});

for (const [tier, provider, slot, schema, databaseKey] of [
  ["regular", "supabase-postgres", "primary", "public", "primary"],
  ["regular", "docker-postgres", "shared", "public", "shared"],
  ["pro", "docker-postgres", "pro_a", "pro_a", "shared"],
  ["enterprise", "docker-postgres", "enterprise_a", "public", "enterprise_a"],
]) {
  test(`${tier} ${provider}: resolves only registered server-owned target`, () => {
    const route = resolveTenantDataRoute({ storeId: A, record: record(tier, provider, slot), targets });
    assert.equal(route.schema, schema);
    assert.equal(route.databaseKey, databaseKey);
    assert.equal(route.storeId, A);
    assert.equal(Object.isFrozen(route), true);
  });
}
test("rejects absent and cross-store mappings", () => {
  assert.throws(() => validateStorageRecord(A, null), TenantRoutingError);
  assert.throws(() => validateStorageRecord(B, record()), /ownership mismatch/);
  assert.throws(() => validateStorageRecord("anything", record()), /Invalid authenticated store/);
});
test("not-ready, disabled and invalid provider records fail closed", () => {
  for (const state of ["pending", "provisioning", "failed", "disabled", undefined]) {
    assert.throws(() => validateStorageRecord(A, { ...record(), provisioning_state: state }), /not ready/);
  }
  assert.throws(() => validateStorageRecord(A, { ...record(), storage_provider: "unknown" }), /Unsupported/);
  assert.throws(() => validateStorageRecord(A, { ...record(), storage_key: "pro_a;DROP SCHEMA" }), /Invalid tenant storage key/);
});
test("no inferred fallback for missing/incorrect registered destinations", () => {
  assert.throws(() => resolveTenantDataRoute({ storeId: A, record: record("pro", "docker-postgres", "missing"), targets }), /not provisioned/);
  assert.throws(() => resolveTenantDataRoute({ storeId: A, record: record("enterprise", "docker-postgres", "pro_a"), targets }), /not provisioned/);
  assert.throws(() => resolveTenantDataRoute({ storeId: A, record: record(), targets: {} }), /not provisioned/);
});
test("tier cannot be silently reinterpreted by target configuration", () => {
  const badTargets = { ...targets, "docker-postgres:pro_a": { ...targets["docker-postgres:pro_a"], schema: "public" } };
  assert.throws(() => resolveTenantDataRoute({ storeId: A, record: record("pro", "docker-postgres", "pro_a"), targets: badTargets }), /isolation tier/);
  const mixed = { ...targets, "docker-postgres:enterprise_a": { ...targets["docker-postgres:enterprise_a"], tier: "pro" } };
  assert.throws(() => resolveTenantDataRoute({ storeId: A, record: record("enterprise", "docker-postgres", "enterprise_a"), targets: mixed }), /not provisioned/);
});
test("unsafe target destinations and remote plaintext Docker hosts are rejected", () => {
  for (const url of ["http://public.example.com/v1/", "http://username:pass@local:3000/", "file:///tmp/test", "https://localhost/?token=abc"]) {
    const replacements = { ...targets, "docker-postgres:shared": { ...targets["docker-postgres:shared"], url } };
    assert.throws(() => resolveTenantDataRoute({ storeId: A, record: record("regular", "docker-postgres", "shared"), targets: replacements }), TenantRoutingError);
  }
});
